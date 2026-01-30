import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const filePath = path.join(
      process.cwd(),
      "src/data/siteData.ts"
    );

    const fileContents = `export const siteData = ${JSON.stringify(
      data,
      null,
      2
    )};
`;

    fs.writeFileSync(filePath, fileContents);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
