import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  return new Promise((resolve) => {
    const projectRoot = path.join(process.cwd());
    const cmd = "npm run scrape";

    exec(cmd, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        console.error("Scrape failed:", stderr);
        resolve(
          NextResponse.json({
            success: false,
            message: "Scraper failed. Check server logs.",
          })
        );
      } else {
        console.log(stdout.slice(0, 300)); // print first few lines only
        resolve(
          NextResponse.json({
            success: true,
            message: "Scrape completed successfully!",
          })
        );
      }
    });
  });
}
