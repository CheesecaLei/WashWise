import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '../../../config/mongodb';


export async function POST(request: NextRequest) {
    const { email, username, address, contactNo, password, confirmPass } = await request.json();

    if (!email || !username || !address || !contactNo || !password || !confirmPass) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (password !== confirmPass) {
        return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    try {
        const db = await getDb();
        const usersCollection = db.collection('users');
        const existingUser = await usersCollection.findOne({ email });
        const existingUsername = await usersCollection.findOne({ username });

        if (existingUsername) {
            return NextResponse.json({ error: 'Username already in use.' }, { status: 400 });
        }

        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            email,
            username,
            address,
            contactNo,
            role: 'member',
            password: hashedPassword,
            createdAt: new Date(),
        };

        await usersCollection.insertOne(newUser);
        return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });
        
    } catch (error) {
        console.error('Error during signup:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }

}