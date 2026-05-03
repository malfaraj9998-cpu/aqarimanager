import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app, { db } from "./firebase"; 

export async function extractContractData(file) {
  // Convert File to base64 generic object
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  
  const inlineData = {
    data: await base64EncodedDataPromise,
    mimeType: file.type || "application/pdf",
  };

  const ai = getAI(app, { backend: new GoogleAIBackend() });
  
  // Use schema for structured output
  const schema = {
    type: "OBJECT",
    properties: {
      client: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          type: { type: "STRING", description: "Individual, Retail, F&B, Tech Corporation, Other" },
          nationality: { type: "STRING" },
          idType: { type: "STRING", description: "هوية وطنية, إقامة, جواز سفر, سجل تجاري" },
          vat: { type: "STRING", description: "ID Number" },
          mobile: { type: "STRING" },
          email: { type: "STRING" },
          nationalAddress: { type: "STRING" },
          selfRepresented: { type: "BOOLEAN" }
        }
      },
      building: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          location: { type: "STRING" },
          type: { type: "STRING" },
          ownerName: { type: "STRING" },
          ownerNationality: { type: "STRING" },
          ownerIdType: { type: "STRING" },
          ownerIdNo: { type: "STRING" },
          ownerMobile: { type: "STRING" },
          ownerEmail: { type: "STRING" },
          ownerNationalAddress: { type: "STRING" },
          ownerSelfRepresented: { type: "BOOLEAN" },
          titleDeedNo: { type: "STRING" },
          titleDeedIssuer: { type: "STRING" },
          titleDeedIssueDate: { type: "STRING" },
          titleDeedIssuedFrom: { type: "STRING" },
          propertyType: { type: "STRING" },
          propertyUsage: { type: "STRING" },
          numberOfFloors: { type: "STRING" },
          numberOfParkingLots: { type: "STRING" },
          numberOfElevators: { type: "STRING" },
          nationalAddress: { type: "STRING" }
        }
      },
      unit: {
        type: "OBJECT",
        properties: {
          unitNumber: { type: "STRING" },
          type: { type: "STRING", description: "Flat, Shop, Office, Villa, Warehouse" },
          floor: { type: "STRING" },
          unitArea: { type: "STRING" },
          furnished: { type: "BOOLEAN" },
          kitchenCabinets: { type: "BOOLEAN" },
          furnishingStatus: { type: "STRING" },
          numberOfAC: { type: "STRING" },
          electricityMeterNo: { type: "STRING" },
          electricityMeterReading: { type: "STRING" },
          gasMeterNo: { type: "STRING" },
          gasMeterReading: { type: "STRING" },
          waterMeterNo: { type: "STRING" },
          waterMeterReading: { type: "STRING" }
        }
      },
      contract: {
        type: "OBJECT",
        properties: {
          contractType: { type: "STRING" },
          sealingDate: { type: "STRING" },
          sealingLocation: { type: "STRING" },
          startDate: { type: "STRING" },
          endDate: { type: "STRING" },
          annualRent: { type: "STRING" },
          paymentFrequency: { type: "STRING" },
          ejarContractNumber: { type: "STRING" },
          brokerageEntityName: { type: "STRING" },
          brokerageCRNo: { type: "STRING" },
          brokerageLandlineNo: { type: "STRING" },
          brokerageFaxNo: { type: "STRING" },
          brokerName: { type: "STRING" },
          brokerNationality: { type: "STRING" },
          brokerIdType: { type: "STRING" },
          brokerIdNo: { type: "STRING" },
          brokerMobile: { type: "STRING" },
          brokerEmail: { type: "STRING" },
          securityDeposit: { type: "STRING" },
          electricityAnnualAmount: { type: "STRING" },
          gasAnnualAmount: { type: "STRING" },
          waterAnnualAmount: { type: "STRING" },
          parkingAnnualAmount: { type: "STRING" },
          regularRentPayment: { type: "STRING" },
          lastRentPayment: { type: "STRING" },
          numberOfRentPayments: { type: "STRING" },
          totalContractValue: { type: "STRING" },
          paymentMethods: { type: "STRING" },
          parkingLotsRented: { type: "STRING" },
          tenantAuthority: { type: "STRING" }
        }
      },
      paymentSchedule: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            no: { type: "NUMBER" },
            rentalPeriodFrom: { type: "STRING" },
            rentalPeriodTo: { type: "STRING" },
            dueDateAD: { type: "STRING" },
            dueDateAH: { type: "STRING" },
            paymentDeadlineAD: { type: "STRING" },
            paymentDeadlineAH: { type: "STRING" },
            durationDays: { type: "STRING" },
            amount: { type: "STRING" }
          }
        }
      }
    }
  };

  const model = getGenerativeModel(ai, { 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const prompt = `You are a highly capable AI specialized in parsing Arabic Ejar contracts (Saudi Arabia). 
Extract all information from the provided Ejar contract PDF document and map it strictly to the provided JSON schema.
- For dates, convert them to YYYY-MM-DD if possible, but keeping them as found is okay.
- If a value is missing or not applicable, return an empty string or false.
- Ensure 'vat' for the client captures their National ID / Iqama.
- Extract the entire payment schedule accurately, including both Gregorian (AD) and Hijri (AH) dates.
- Handle translations properly: if the schema expects 'Flat' but the text says 'شقة', map it to 'Flat'. (Flat, Shop, Office, Villa, Warehouse)
- 'ejarContractNumber' is 'رقم العقد' or 'رقم عقد إيجار'.
`;

  try {
    const result = await model.generateContent([prompt, { inlineData }]);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Error extracting contract data:", error);
    throw error;
  }
}
