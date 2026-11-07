import axios from "axios";
import { config } from "../config/env.js";

const systemPrompt = `
Bạn là AI chuyên đọc đơn thuốc từ hình ảnh.

Nhiệm vụ:
Trích xuất thông tin đơn thuốc từ hình ảnh
và trả về JSON theo đúng cấu trúc yêu cầu.

Yêu cầu:
- Chỉ trả về JSON thuần túy.
- Không markdown, không giải thích.
- Không tự suy đoán thông tin không đọc được.
- Nếu không đọc được thông tin, trả về null.
- Phân biệt rõ hàm lượng thuốc và liều dùng mỗi lần.
- Không tự tạo lịch uống thuốc khi đơn thuốc không ghi rõ.
- Giữ nguyên đơn vị và nội dung gốc khi có thể.

Các enum hợp lệ:

Usage:
ORAL, SUBLINGUAL, CHEW, TOPICAL,
EYE_DROPS, EAR_DROPS, NASAL_DROPS,
IM, IV, SC, RECTAL, VAGINAL

MedicineForm:
TABLET, POWDER, VIAL, SYRUP,
TUBE, BOTTLE

DosageUnit:
MG, MCG, G, IU, ML, PERCENT

Timing:
MORNING, NOON, AFTERNOON, EVENING, BEDTIME

Note:
BEFORE_MEAL, AFTER_MEAL, WITH_MEAL,
WITH_WATER, AVOID_ALCOHOL, AVOID_DAIRY

JSON format:

{
  "name": null,
  "description": null,
  "userId": null,
  "patientEmailAddress": null,
  "startDate": null,
  "message": null,
  "diagnosisNote": null,
  "info": null,
  "intakes": [
    {
      "drugName": null,
      "drugId": null,
      "total": null,
      "unit": null,
      "quantitative": null,
      "medicineForm": null,
      "usage": null,
      "timingList": [
        {
          "timing": null,
          "quantity": null
        }
      ],
      "noteList": []
    }
  ]
}
`;

export async function analyzePrescription(imageBuffer, mimeType) {
  const base64Image = imageBuffer.toString("base64");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${config.gemini.model}:generateContent`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },

    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Hãy phân tích đơn thuốc trong hình.",
          },
        ],
      },
    ],

    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  const response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.gemini.apiKey,
    },
    timeout: 120000,
  });

  const candidates = response.data?.candidates;

  if (!candidates?.length) {
    throw new Error("Gemini returned no candidates");
  }

  const rawText = candidates[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!rawText || rawText.toLowerCase() === "null") {
    throw new Error("Unable to analyze prescription image");
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }
}
