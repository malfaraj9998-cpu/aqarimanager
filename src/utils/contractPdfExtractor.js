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
    type: "object",
    properties: {
      client: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", description: "Individual, Retail, F&B, Tech Corporation, Other" },
          nationality: { type: "string" },
          idType: { type: "string", description: "هوية وطنية, إقامة, جواز سفر, سجل تجاري" },
          vat: { type: "string", description: "ID Number" },
          mobile: { type: "string" },
          email: { type: "string" },
          nationalAddress: { type: "string" },
          selfRepresented: { type: "boolean" }
        }
      },
      building: {
        type: "object",
        properties: {
          name: { type: "string" },
          location: { type: "string" },
          type: { type: "string" },
          ownerName: { type: "string" },
          ownerNationality: { type: "string" },
          ownerIdType: { type: "string" },
          ownerIdNo: { type: "string" },
          ownerMobile: { type: "string" },
          ownerEmail: { type: "string" },
          ownerNationalAddress: { type: "string" },
          ownerSelfRepresented: { type: "boolean" },
          titleDeedNo: { type: "string" },
          titleDeedIssuer: { type: "string" },
          titleDeedIssueDate: { type: "string" },
          titleDeedIssuedFrom: { type: "string" },
          propertyType: { type: "string" },
          propertyUsage: { type: "string" },
          numberOfFloors: { type: "string" },
          numberOfParkingLots: { type: "string" },
          numberOfElevators: { type: "string" },
          nationalAddress: { type: "string" }
        }
      },
      unit: {
        type: "object",
        properties: {
          unitNumber: { type: "string" },
          type: { type: "string", description: "Flat, Shop, Office, Villa, Warehouse" },
          floor: { type: "string" },
          unitArea: { type: "string" },
          furnished: { type: "boolean" },
          kitchenCabinets: { type: "boolean" },
          furnishingStatus: { type: "string" },
          numberOfAC: { type: "string" },
          electricityMeterNo: { type: "string" },
          electricityMeterReading: { type: "string" },
          gasMeterNo: { type: "string" },
          gasMeterReading: { type: "string" },
          waterMeterNo: { type: "string" },
          waterMeterReading: { type: "string" }
        }
      },
      contract: {
        type: "object",
        properties: {
          contractType: { type: "string" },
          sealingDate: { type: "string" },
          sealingLocation: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          annualRent: { type: "string" },
          paymentFrequency: { type: "string" },
          ejarContractNumber: { type: "string" },
          brokerageEntityName: { type: "string" },
          brokerageCRNo: { type: "string" },
          brokerageLandlineNo: { type: "string" },
          brokerageFaxNo: { type: "string" },
          brokerName: { type: "string" },
          brokerNationality: { type: "string" },
          brokerIdType: { type: "string" },
          brokerIdNo: { type: "string" },
          brokerMobile: { type: "string" },
          brokerEmail: { type: "string" },
          securityDeposit: { type: "string" },
          electricityAnnualAmount: { type: "string" },
          gasAnnualAmount: { type: "string" },
          waterAnnualAmount: { type: "string" },
          parkingAnnualAmount: { type: "string" },
          regularRentPayment: { type: "string" },
          lastRentPayment: { type: "string" },
          numberOfRentPayments: { type: "string" },
          totalContractValue: { type: "string" },
          paymentMethods: { type: "string" },
          parkingLotsRented: { type: "string" },
          tenantAuthority: { type: "string" }
        }
      },
      paymentSchedule: {
        type: "array",
        items: {
          type: "object",
          properties: {
            no: { type: "number" },
            rentalPeriodFrom: { type: "string" },
            rentalPeriodTo: { type: "string" },
            dueDateAD: { type: "string" },
            dueDateAH: { type: "string" },
            paymentDeadlineAD: { type: "string" },
            paymentDeadlineAH: { type: "string" },
            durationDays: { type: "string" },
            amount: { type: "string" }
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
