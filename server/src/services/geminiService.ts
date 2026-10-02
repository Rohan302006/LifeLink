/**
 * Gemini AI Service Wrapper (Server-Side Only)
 * 
 * Capabilities:
 * 1. Multilingual FAQ and Guidance Assistant (English, Hindi, Marathi)
 * 2. Emergency Free-Text/Voice Intake -> Structured Blood Request Draft
 * 3. Simple-Language Explainer for Eligibility & Organ Pledging
 * 
 * CRITICAL GUARDRAILS:
 * - AI must NEVER diagnose any disease or symptom
 * - AI must NEVER declare anyone clinically eligible or ineligible
 * - AI must always instruct users to consult a qualified physician
 * - Output must always append the LifeLink Coordination Disclaimer
 */

import { config } from '../config/env.js';

export interface StructuredRequestDraft {
  patient_name: string | null;
  blood_group: string | null;
  component: 'whole_blood' | 'packed_rbc' | 'platelets' | 'plasma' | null;
  units_needed: number | null;
  hospital_name: string | null;
  urgency: 'critical_immediate' | 'urgent_within_24h' | 'planned' | null;
  summary_notes: string;
  language_detected: string;
  medical_disclaimer: string;
}

const MANDATORY_DISCLAIMER = 
  'LifeLink is a verified coordination platform, NOT a medical decision-making or organ allocation system. Final donor eligibility and crossmatching are performed solely by certified medical doctors.';

/**
 * Parses free text emergency intake into a structured draft
 */
export async function parseEmergencyIntake(
  text: string,
  targetLanguage: string = 'en'
): Promise<StructuredRequestDraft> {
  // If Gemini API Key is provided, call Google Generative AI API
  if (config.geminiApiKey) {
    try {
      const prompt = `
You are the LifeLink Emergency Coordination Assistant. Your role is strictly to extract emergency blood request details into structured JSON.
CRITICAL SAFETY RULES:
- You must NEVER make medical judgments, diagnose, or declare eligibility.
- Always be neutral, calm, and objective.

Extract the following JSON structure from this user message:
User Message: "${text}"

JSON schema required:
{
  "patient_name": string or null,
  "blood_group": "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" or null,
  "component": "whole_blood" | "packed_rbc" | "platelets" | "plasma",
  "units_needed": number (default 1 if unspecified),
  "hospital_name": string or null,
  "urgency": "critical_immediate" | "urgent_within_24h" | "planned",
  "summary_notes": string (brief 1-sentence extraction)
}
Return ONLY valid JSON.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            patient_name: parsed.patient_name || null,
            blood_group: parsed.blood_group || null,
            component: parsed.component || 'whole_blood',
            units_needed: parsed.units_needed || 1,
            hospital_name: parsed.hospital_name || null,
            urgency: parsed.urgency || 'urgent_within_24h',
            summary_notes: parsed.summary_notes || text,
            language_detected: targetLanguage,
            medical_disclaimer: MANDATORY_DISCLAIMER
          };
        }
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, using intelligent rule-based intake fallback:', err.message);
    }
  }

  // Fallback intelligent extraction (works offline & without API key)
  const lower = text.toLowerCase();
  
  // Blood group detection
  const bgMatch = text.match(/\b(A|B|AB|O)[+-]\b/i) || text.match(/\b(A|B|AB|O)\s+(positive|negative)\b/i);
  let blood_group: string | null = null;
  if (bgMatch) {
    let raw = bgMatch[0].toUpperCase().replace(/\s+/g, '');
    raw = raw.replace('POSITIVE', '+').replace('NEGATIVE', '-');
    blood_group = raw;
  }

  // Units detection
  const unitMatch = text.match(/(\d+)\s*(unit|bottle|bag|pint)s?/i);
  const units_needed = unitMatch ? parseInt(unitMatch[1], 10) : 1;

  // Component detection
  let component: 'whole_blood' | 'packed_rbc' | 'platelets' | 'plasma' = 'whole_blood';
  if (lower.includes('platelet') || lower.includes('sdp') || lower.includes('rdp')) {
    component = 'platelets';
  } else if (lower.includes('plasma') || lower.includes('ffp')) {
    component = 'plasma';
  }

  // Urgency
  let urgency: 'critical_immediate' | 'urgent_within_24h' | 'planned' = 'urgent_within_24h';
  if (lower.includes('emergency') || lower.includes('immediately') || lower.includes('icu') || lower.includes('critical') || lower.includes('urgent') || lower.includes('urgent')) {
    urgency = 'critical_immediate';
  }

  // Hospital name heuristic
  let hospital_name: string | null = null;
  if (lower.includes('lilavati')) hospital_name = 'Lilavati Hospital & Research Centre';
  else if (lower.includes('tata') || lower.includes('tmc')) hospital_name = 'Tata Memorial Hospital';
  else if (lower.includes('kem')) hospital_name = 'King Edward Memorial (KEM) Hospital';

  // Patient name heuristic (e.g. "for Suresh" or "patient Suresh")
  const patientMatch = text.match(/(?:for|patient|patient name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  const patient_name = patientMatch ? patientMatch[1] : null;

  return {
    patient_name,
    blood_group,
    component,
    units_needed,
    hospital_name,
    urgency,
    summary_notes: `Structured intake: ${units_needed} unit(s) ${component} for ${patient_name || 'Patient'} at ${hospital_name || 'Hospital'}.`,
    language_detected: targetLanguage,
    medical_disclaimer: MANDATORY_DISCLAIMER
  };
}

/**
 * Multilingual FAQ & Explainer Assistant
 * Languages: en (English), hi (Hindi), mr (Marathi)
 */
export async function getAiAssistantResponse(
  query: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<{ reply: string; disclaimer: string; officialLinks: { title: string; url: string }[] }> {
  const officialLinks = [
    { title: 'e-RaktKosh (Official Central Blood Stock Portal)', url: 'https://eraktkosh.mohfw.gov.in' },
    { title: 'NOTTO (National Organ & Tissue Transplant Organisation)', url: 'https://notto.mohfw.gov.in' }
  ];

  if (config.geminiApiKey) {
    try {
      const prompt = `
You are the official LifeLink Donation Assistant.
Respond in ${language === 'hi' ? 'Hindi (हिंदी)' : language === 'mr' ? 'Marathi (मराठी)' : 'English'}.
Strict Guidelines:
1. LifeLink is a coordination platform, NOT a medical decision-maker or organ allocation system.
2. Organ allocation belongs strictly to NOTTO/ROTTO/SOTTO in India.
3. Central blood stock availability is tracked by e-RaktKosh.
4. You must NEVER diagnose, advise treatments, or give definitive clinical eligibility clearances. Always advise consulting a doctor.
5. Keep your tone calm, professional, concise, and helpful.

User Query: "${query}"
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return {
            reply: reply.trim(),
            disclaimer: MANDATORY_DISCLAIMER,
            officialLinks
          };
        }
      }
    } catch (err: any) {
      console.warn('Gemini FAQ call failed, using localized knowledge fallback:', err.message);
    }
  }

  // High-quality localized fallback responses
  const qLower = query.toLowerCase();

  if (language === 'hi') {
    // Hindi fallback
    if (qLower.includes('पात्रता') || qLower.includes('eligible') || qLower.includes('रक्तदान')) {
      return {
        reply: 'सामान्य दिशानिर्देशों के अनुसार, रक्तदान के लिए न्यूनतम अंतर आमतौर पर 90 दिन (Whole Blood) होता है। हालांकि, अंतिम स्वास्थ्य पात्रता की जांच अस्पताल में डॉक्टर द्वारा की जाती है। यदि आपके पास हाल ही में टैटू, सर्जरी या कोई दवा है, तो डॉक्टर से परामर्श करें।',
        disclaimer: MANDATORY_DISCLAIMER,
        officialLinks
      };
    }
    if (qLower.includes('अंगदान') || qLower.includes('organ') || qLower.includes('प्रतिज्ञा')) {
      return {
        reply: 'अंगदान का संकल्प लेना एक महान कदम है। भारत में वास्तविक आवंटन और आधिकारिक पंजीकरण NOTTO (National Organ & Tissue Transplant Organisation) द्वारा किया जाता है। LifeLink पर आप अपनी मंशा दर्ज कर सकते हैं और परिवार से चर्चा कर सकते हैं, जिसके बाद NOTTO पोर्टल पर पंजीकृत होना आवश्यक है।',
        disclaimer: MANDATORY_DISCLAIMER,
        officialLinks
      };
    }
    return {
      reply: 'LifeLink में आपका स्वागत है। हम आपातकालीन रक्तदान समन्वय और अंगदान जागरूकता में सहायता करते हैं। कृपया बताएं कि आप रक्तदान करना चाहते हैं या रक्त की आवश्यकता है?',
      disclaimer: MANDATORY_DISCLAIMER,
      officialLinks
    };
  }

  if (language === 'mr') {
    // Marathi fallback
    if (qLower.includes('पात्रता') || qLower.includes('रक्तदान') || qLower.includes('नियम')) {
      return {
        reply: 'सामान्य नियमांनुसार संपूर्ण रक्तदानामध्ये किमान ९० दिवसांचा कालावधी असणे आवश्यक मानले जाते. परंतु, तुमची शारीरिक तपासणी आणि अंतिम मंजुरी केवळ रक्तपेढीतील डॉक्टरच देतात. LifeLink केवळ पूर्व-तपासणी समन्वय करते.',
        disclaimer: MANDATORY_DISCLAIMER,
        officialLinks
      };
    }
    if (qLower.includes('अवयव') || qLower.includes('organ') || qLower.includes('नोंदणी')) {
      return {
        reply: 'अवयवदान प्रतिज्ञा घेण्यासाठी आपल्या कुटुंबाशी चर्चा करणे अत्यंत महत्त्वाचे आहे. अधिकृत नोंदणी NOTTO / ROTTO / SOTTO या सरकारी संस्थांमार्फत केली जाते. LifeLink वरील प्रतिज्ञा ही जागृतीसाठी असून प्रत्यक्ष नोंदणीसाठी NOTTO च्या पोर्टलला भेट द्यावी.',
        disclaimer: MANDATORY_DISCLAIMER,
        officialLinks
      };
    }
    return {
      reply: 'LifeLink समन्वय प्लॅटफॉर्मवर आपले स्वागत आहे. आम्ही आपत्कालीन रक्तदान समन्वय आणि अवयवदान जागृतीसाठी मदत करतो. आम्ही आपल्याला कशी मदत करू शकतो?',
      disclaimer: MANDATORY_DISCLAIMER,
      officialLinks
    };
  }

  // English fallback
  if (qLower.includes('eligible') || qLower.includes('gap') || qLower.includes('frequency') || qLower.includes('cooldown')) {
    return {
      reply: 'Standard guidelines recommend an interval of 90 days between whole blood donations (14 days for plasma, 7 days for platelets). However, LifeLink calculates interval eligibility for coordination only; final clinical clearance (hemoglobin, vitals, history) is conducted on-site by a licensed medical practitioner.',
      disclaimer: MANDATORY_DISCLAIMER,
      officialLinks
    };
  }

  if (qLower.includes('organ') || qLower.includes('pledge') || qLower.includes('notto')) {
    return {
      reply: 'Organ donation pledges on LifeLink serve to record your personal intent and facilitate crucial conversations with your next-of-kin. Official legal registration and organ allocation are managed strictly by NOTTO (National Organ & Tissue Transplant Organisation) under the Ministry of Health and Family Welfare, Government of India.',
      disclaimer: MANDATORY_DISCLAIMER,
      officialLinks
    };
  }

  if (qLower.includes('stock') || qLower.includes('availability') || qLower.includes('eraktkosh')) {
    return {
      reply: 'To check live centralized blood bank stock levels across India, please refer to the official e-RaktKosh portal. LifeLink activates when blood bank stocks are depleted and real-time emergency donor-to-patient coordination is required.',
      disclaimer: MANDATORY_DISCLAIMER,
      officialLinks
    };
  }

  return {
    reply: 'Welcome to LifeLink. I can assist you with emergency request drafting, donation interval questions, and organ pledge guidance. Please note that all requests require medical verification by an authorized hospital doctor before donor dispatch.',
    disclaimer: MANDATORY_DISCLAIMER,
    officialLinks
  };
}
