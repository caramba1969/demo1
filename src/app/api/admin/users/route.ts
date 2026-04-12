import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Factory } from "@/lib/models/Factory";
import { Location } from "@/lib/models/Location";
import ProductionLine from "@/lib/models/ProductionLine";

// GET /api/admin/users — list all users with optional data stats
export async function GET(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const includeStats = searchParams.get("stats") === "true";

  await dbConnect();

  const users = await User.find({})
    .select("name email image role createdAt")
    .sort({ createdAt: -1 })
    .lean() as unknown as Array<{
      _id: unknown;
      name?: string;
      email: string;
      image?: string;
      role: string;
      createdAt?: Date;
    }>;

  if (!includeStats) {
    return NextResponse.json(users);
  }

  // Attach data counts for each user in parallel
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const userId = String(user._id);

      const [factoryCount, locationCount] = await Promise.all([
        Factory.countDocuments({ userId }),
        Location.countDocuments({ userId }),
      ]);

      // Count production lines via factories (2-level join)
      const factories = await Factory.find({ userId }).select("_id").lean() as { _id: unknown }[];
      const factoryIds = factories.map((f) => f._id);
      const productionLineCount = factoryIds.length > 0
        ? await ProductionLine.countDocuments({ factoryId: { $in: factoryIds } })
        : 0;

      return { ...user, stats: { factoryCount, locationCount, productionLineCount } };
    })
  );

  return NextResponse.json(usersWithStats);
}
