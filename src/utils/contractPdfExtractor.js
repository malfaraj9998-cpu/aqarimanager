import { getVertexAI, getGenerativeModel, Schema, Type } from "firebase/vertexai";
import { db, app } from "./firebase"; // Assuming we have an initialized app

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

  const vertexAI = getVertexAI(app);
  
  // Use schema for structured output
  const schema = {
    type: Type.OBJECT,
    properties: {
      client: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, description: "Individual, Retail, F&B, Tech Corporation, Other" },
          nationality: { type: Type.STRING },
          idType: { type: Type.STRING, description: "هوية وطنية, إقامة, جواز سفر, سجل تجاري" },
          vat: { type: Type.STRING, description: "ID Number" },
          mobile: { type: Type.STRING },
          email: { type: Type.STRING },
          nationalAddress: { type: Type.STRING },
          selfRepresented: { type: Type.BOOLEAN }
        }
      },
      building: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          location: { type: Type.STRING },
          type: { type: Type.STRING },
          ownerName: { type: Type.STRING },
          ownerNationality: { type: Type.STRING },
          ownerIdType: { type: Type.STRING },
          ownerIdNo: { type: Type.STRING },
          ownerMobile: { type: Type.STRING },
          ownerEmail: { type: Type.STRING },
          ownerNationalAddress: { type: Type.STRING },
          ownerSelfRepresented: { type: Type.BOOLEAN },
          titleDeedNo: { type: Type.STRING },
          titleDeedIssuer: { type: Type.STRING },
          titleDeedIssueDate: { type: Type.STRING },
          titleDeedIssuedFrom: { type: Type.STRING },
          propertyType: { type: Type.STRING },
          propertyUsage: { type: Type.STRING },
          numberOfFloors: { type: Type.STRING },
          numberOfParkingLots: { type: Type.STRING },
          numberOfElevators: { type: Type.STRING },
          nationalAddress: { type: Type.STRING }
        }
      },
      unit: {
        type: Type.OBJECT,
        properties: {
          unitNumber: { type: Type.STRING },
          type: { type: Type.STRING, description: "Flat, Shop, Office, Villa, Warehouse" },
          floor: { type: Type.STRING },
          unitArea: { type: Type.STRING },
          furnished: { type: Type.BOOLEAN },
          kitchenCabinets: { type: Type.BOOLEAN },
          furnishingStatus: { type: Type.STRING },
          numberOfAC: { type: Type.STRING },
          electricityMeterNo: { type: Type.STRING },
          electricityMeterReading: { type: Type.STRING },
          gasMeterNo: { type: Type.STRING },
          gasMeterReading: { type: Type.STRING },
          waterMeterNo: { type: Type.STRING },
          waterMeterReading: { type: Type.STRING }
        }
      },
      contract: {
        type: Type.OBJECT,
        properties: {
          contractType: { type: Type.STRING },
          sealingDate: { type: Type.STRING },
          sealingLocation: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          annualRent: { type: Type.STRING },
          paymentFrequency: { type: Type.STRING },
          ejarContractNumber: { type: Type.STRING },
          brokerageEntityName: { type: Type.STRING },
          brokerageCRNo: { type: Type.STRING },
          brokerageLandlineNo: { type: Type.STRING },
          brokerageFaxNo: { type: Type.STRING },
          brokerName: { type: Type.STRING },
          brokerNationality: { type: Type.STRING },
          brokerIdType: { type: Type.STRING },
          brokerIdNo: { type: Type.STRING },
          brokerMobile: { type: Type.STRING },
          brokerEmail: { type: Type.STRING },
          securityDeposit: { type: Type.STRING },
          electricityAnnualAmount: { type: Type.STRING },
          gasAnnualAmount: { type: Type.STRING },
          waterAnnualAmount: { type: Type.STRING },
          parkingAnnualAmount: { type: Type.STRING },
          regularRentPayment: { type: Type.STRING },
          lastRentPayment: { type: Type.STRING },
          numberOfRentPayments: { type: Type.STRING },
          totalContractValue: { type: Type.STRING },
          paymentMethods: { type: Type.STRING },
          parkingLotsRented: { type: Type.STRING },
          tenantAuthority: { type: Type.STRING }
        }
      },
      paymentSchedule: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            no: { type: Type.NUMBER },
            rentalPeriodFrom: { type: Type.STRING },
            rentalPeriodTo: { type: Type.STRING },
            dueDateAD: { type: Type.STRING },
            dueDateAH: { type: Type.STRING },
            paymentDeadlineAD: { type: Type.STRING },
            paymentDeadlineAH: { type: Type.STRING },
            durationDays: { type: Type.STRING },
            amount: { type: Type.STRING }
          }
        }
      }
    }
  };

  const model = getGenerativeModel(vertexAI, { 
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
