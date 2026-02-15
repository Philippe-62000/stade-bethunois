import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userCount = await User.countDocuments();
    const authUser = getAuthUser(request);

    const allowed =
      userCount === 0 ||
      (authUser !== null && authUser.role === 'admin');

    return NextResponse.json({
      allowed,
      firstSetup: userCount === 0,
    });
  } catch (error) {
    return NextResponse.json({ allowed: false, firstSetup: false });
  }
}
