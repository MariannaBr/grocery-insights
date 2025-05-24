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
  date: Date;
  totalAmount: number;
  totalItems: number;
  items: ReceiptItem[];
}

interface OpenAIResponseItem {
  name: string;
  code: string;
  size?: string;
  price: string;
  purchaseDate: string;
  [key: string]: string | undefined;
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
      model: "gpt-4o-mini",
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
              text: "Extract the following information from this receipt: store name, purchase date, total amount, total items, and for each item: name, code, size, price, and purchase date. Return ONLY the JSON data without any markdown formatting or additional text."
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
      // Clean the response content by removing any markdown formatting
      const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
      //console.log("Cleaned OpenAI Response:", cleanedContent);

      const data = JSON.parse(cleanedContent);

      // Validate required fields
      if (
        !data.store_name ||
        !data.purchase_date ||
        !data.total_amount ||
        !data.total_items ||
        !Array.isArray(data.items)
      ) {
        console.error("Missing required fields in OpenAI response:", data);
        throw new Error("Invalid response format: missing required fields");
      }

      // Validate and transform the data
      const transformedData = {
        storeName: String(data.store_name),
        date: new Date(data.purchase_date),
        totalAmount: parseFloat(data.total_amount),
        totalItems: data.total_items,
        items: data.items.map((item: OpenAIResponseItem) => {
          if (!item.name || !item.code || !item.price || !item.purchase_date) {
            console.error("Invalid item format:", item);
            throw new Error("Invalid item format in response");
          }
          return {
            ...item,
            price: parseFloat(item.price),
            date: new Date(item.purchase_date)
          };
        })
      };

      // Validate the transformed data
      if (isNaN(transformedData.totalAmount)) {
        throw new Error("Invalid total amount format");
      }

      if (
        transformedData.items.some((item: ReceiptItem) => isNaN(item.price))
      ) {
        throw new Error("Invalid price format in items");
      }

      return transformedData;
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      console.error("Raw response content:", content);
      throw new Error(
        `Failed to parse OpenAI response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("Error in extractReceiptData:", error);
    throw error;
  } finally {
    // Clean up temporary file
    try {
      await fs.promises.unlink(tempFilePath);
    } catch (error) {
      console.error("Error cleaning up temporary file:", error);
    }
  }
}

export async function generateShoppingInsights(
  receipts: ReceiptData[]
): Promise<string> {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(receipts)
            },
            {
              type: "input_text",
              text: `You are a shopping insights expert. Analyze the following receipt data and provide meaningful insights about shopping patterns, spending habits, and recommendations. Focus on:
              1. Most frequent stores
              2. Average spending per trip
              3. Common items purchased
              4. Spending trends over time
              5. Potential savings opportunities
              Format the response in a clear, structured way with sections and bullet points.`
            }
          ]
        }
      ],
      temperature: 1,
      max_output_tokens: 1000
    });

    const insights = response.output_text;
    if (!insights) {
      throw new Error("No insights generated");
    }

    return insights;
  } catch (error) {
    console.error("Error generating shopping insights:", error);
    throw new Error("Failed to generate shopping insights");
  }
}
