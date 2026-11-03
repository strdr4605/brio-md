import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { role, fullName, institutionName, phone, email, city, studentCount, message } = body;

    if (!fullName || !phone || !email) {
      return NextResponse.json(
        { error: "Missing required contact details." },
        { status: 400 },
      );
    }

    // eslint-disable-next-line no-console
    console.log("📥 [PILOT_LEAD_REQUEST]:", {
      timestamp: new Date().toISOString(),
      role,
      fullName,
      institutionName,
      phone,
      email,
      city,
      studentCount,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Pilot access request received successfully.",
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to process pilot lead request:", err);
    return NextResponse.json(
      { error: "Internal server error while processing request." },
      { status: 500 },
    );
  }
}

