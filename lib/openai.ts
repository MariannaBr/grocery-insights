import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ReceiptItem {
  name: string;
  code: string;
  size: string;
  price: number;
  purchaseDate: Date;
  [key: string]: string | number | Date;
}

export interface ReceiptData {
  storeName: string;
  purchaseDate: Date;
  totalAmount: number;
  items: ReceiptItem[];
}

interface OpenAIResponseItem {
  name: string;
  code: string;
  size: string;
  price: string;
  purchaseDate: string;
  [key: string]: string;
}

export async function extractReceiptData(
  fileBuffer: Buffer,
  fileType: string
): Promise<ReceiptData> {
  // Create a temporary file
  const tempFilePath = `/tmp/${Date.now()}-receipt.${
    fileType === "application/pdf" ? "pdf" : "jpg"
  }`;
  await fs.promises.writeFile(tempFilePath, fileBuffer);

  try {
    // Upload file to OpenAI
    const file = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "user_data"
    });

    // Get response from OpenAI
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: file.id
            },
            {
              type: "input_text",
              text: "Extract the following information from this receipt: store name, purchase date, total amount, and for each item: name, code, size, price, and purchase date. Return the data in JSON format."
            }
          ]
        }
      ]
    });

    const content = response.output_text;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      const data = JSON.parse(content);
      return {
        storeName: data.storeName,
        purchaseDate: new Date(data.purchaseDate),
        totalAmount: parseFloat(data.totalAmount),
        items: data.items.map((item: OpenAIResponseItem) => ({
          ...item,
          price: parseFloat(item.price),
          purchaseDate: new Date(item.purchaseDate)
        }))
      };
    } catch {
      throw new Error("Failed to parse OpenAI response");
    }
  } finally {
    // Clean up temporary file
    await fs.promises.unlink(tempFilePath);
  }
}
