import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Clear auth cookie
    cookies().delete('__clerk_db_jwt');

    return NextResponse.json({
      success: true,
      message: "Signed out successfully"
    });
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

// Also handle GET requests for sign-out links
export async function GET() {
  try {
    // Clear auth cookie
    cookies().delete('__clerk_db_jwt');
    
    // Redirect to home page
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
} 