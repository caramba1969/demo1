import { NextRequest, NextResponse } from 'next/server';
import { importSatisfactoryData } from '@/lib/importSatisfactoryData';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
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
