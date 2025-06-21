import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { importSatisfactoryData } from '@/lib/importSatisfactoryData';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // For now, allow any authenticated user to import data
    // In production, you might want to check for admin role
    // if (!session.user?.isAdmin) {
    //   return NextResponse.json(
    //     { error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    // Get the data file path (you can customize this)
    const dataFilePath = path.join(process.cwd(), 'data1.0.json');
    
    // Import the data
    const result = await importSatisfactoryData(dataFilePath);
    
    return NextResponse.json({
      message: 'Satisfactory data imported successfully',
      ...result
    });
  } catch (error: any) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import Satisfactory data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
