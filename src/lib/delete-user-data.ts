import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Factory } from "@/lib/models/Factory";
import { Location } from "@/lib/models/Location";
import { FactoryImport } from "@/lib/models/FactoryImport";
import { Otp } from "@/lib/models/Otp";
import ProductionLine from "@/lib/models/ProductionLine";

export interface DeleteUserDataResult {
  email: string;
  deleted: {
    factories: number;
    productionLines: number;
    locations: number;
    imports: number;
    otps: number;
  };
}

/**
 * Cascade-deletes a user and ALL their associated data.
 * Order matters: production lines before factories; factories/locations/imports before user.
 */
export async function deleteUserData(userId: string): Promise<DeleteUserDataResult> {
  await dbConnect();

  // 1. Find the user first (need email for OTP cleanup + response)
  const user = await User.findById(userId).select("email").lean() as { email: string } | null;
  if (!user) throw new Error("User not found");

  const email = user.email;

  // 2. Find all factory IDs for this user
  const factories = await Factory.find({ userId }).select("_id").lean() as { _id: unknown }[];
  const factoryIds = factories.map((f) => f._id);

  // 3. Delete all production lines for those factories
  const plResult = factoryIds.length > 0
    ? await ProductionLine.deleteMany({ factoryId: { $in: factoryIds } })
    : { deletedCount: 0 };

  // 4. Delete all factories
  const factoryResult = await Factory.deleteMany({ userId });

  // 5. Delete all locations
  const locationResult = await Location.deleteMany({ userId });

  // 6. Delete all factory imports/exports (userId-scoped)
  const importResult = await FactoryImport.deleteMany({ userId });

  // 7. Delete any outstanding OTPs for this email
  const otpResult = await Otp.deleteMany({ email });

  // 8. Delete the user document itself
  await User.findByIdAndDelete(userId);

  return {
    email,
    deleted: {
      factories: factoryResult.deletedCount,
      productionLines: plResult.deletedCount,
      locations: locationResult.deletedCount,
      imports: importResult.deletedCount,
      otps: otpResult.deletedCount,
    },
  };
}
