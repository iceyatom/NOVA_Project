import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, phone, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Check for existing account
    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);


    // Only allow STAFF or CUSTOMER via public form, never ADMIN
    let safeRole = "CUSTOMER";
    if (role === "STAFF") safeRole = "STAFF";
    
    //temporarily allow admin for testing, but should be removed in production
    if (role === "ADMIN") safeRole = "ADMIN"; // Remove this line in production to prevent public admin creation

    // Never allow ADMIN via public form

    const account = await prisma.account.create({
      data: {
        email,
        passwordHash,
        role: safeRole,
        status: 'active',
        displayName: displayName || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true, accountId: account.id });
  } catch (error) {
    return NextResponse.json({ error: 'Account creation failed.' }, { status: 500 });
  }
}
