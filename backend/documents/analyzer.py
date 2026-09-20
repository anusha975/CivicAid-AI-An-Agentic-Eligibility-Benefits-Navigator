"""
CivicAid AI - Document Analysis & Readiness Module
Extracts text from uploaded PDF/image sample documents, classifies Indian government document types,
extracts structural fields, matches them against scheme document requirements, and provides safety disclaimers.

Zero Hallucination / Ethical Boundary:
- NEVER claims a document is authentic or legally verified.
- Masks PII (e.g. Aadhaar numbers).
"""
import io
import re
from typing import Dict, Any, List, Optional, Tuple


class DocumentAnalyzer:
    """
    Analyzes uploaded files (PDF/Images) to identify document categories and extract key fields.
    """

    DOCUMENT_SIGNATURES = [
        {
            "type": "Aadhaar Card",
            "canonical_requirement": "Aadhaar Card",
            "keywords": ["unique identification authority", "uidai", "aadhaar", "mera aadhaar", "meraadhaar", "father", "yob", "enrolment no", "vid:"],
            "regex": [r"\b\d{4}\s\d{4}\s\d{4}\b", r"\b\d{12}\b", r"\buidai\b"],
            "issuing_authority": "Unique Identification Authority of India (UIDAI)"
        },
        {
            "type": "PAN Card",
            "canonical_requirement": "PAN Card",
            "keywords": ["income tax department", "permanent account number", "govt of india", "pan card", "father's name"],
            "regex": [r"[A-Z]{5}[0-9]{4}[A-Z]"],
            "issuing_authority": "Income Tax Department, Government of India"
        },
        {
            "type": "Income Certificate",
            "canonical_requirement": "Income Certificate",
            "keywords": ["income certificate", "annual income", "tahasildar", "tehsildar", "sub divisional magistrate", "revenue department", "e-district", "parivar", "family income", "rupees in words"],
            "regex": [r"annual\s*(?:family)?\s*income", r"certified\s*that.*income", r"tehsildar", r"revenue\s*officer"],
            "issuing_authority": "Revenue Department / Office of the Tehsildar"
        },
        {
            "type": "Caste Certificate",
            "canonical_requirement": "Caste Certificate",
            "keywords": ["caste certificate", "community certificate", "scheduled caste", "scheduled tribe", "other backward class", "sc/st", "obc certificate", "social welfare department"],
            "regex": [r"caste\s*certificate", r"community\s*certificate", r"scheduled\s*(?:caste|tribe)", r"backward\s*class"],
            "issuing_authority": "Revenue Department / District Magistrate / Tehsildar"
        },
        {
            "type": "Bank Passbook / Account Proof",
            "canonical_requirement": "Bank Account details linked with Aadhaar",
            "keywords": ["passbook", "bank account", "ifsc", "account number", "branch", "savings bank", "bank of", "state bank", "punjab national", "canara", "hdfc", "icici", "npci"],
            "regex": [r"\b[A-Z]{4}0[A-Z0-9]{6}\b", r"account\s*(?:no|number)", r"ifsc\s*code"],
            "issuing_authority": "Recognized Commercial / Scheduled Bank (NPCI Aadhaar-seeded)"
        },
        {
            "type": "College ID / Student Bonafide",
            "canonical_requirement": "College / Student ID Card",
            "keywords": ["student id", "college", "university", "institute", "bonafide certificate", "roll no", "enrollment no", "b.tech", "degree", "semester", "academic year", "department of"],
            "regex": [r"student\s*identity", r"bonafide\s*certificate", r"roll\s*(?:no|number)", r"enrollment\s*no"],
            "issuing_authority": "Educational Institute / University Registrar"
        },
        {
            "type": "Marks Memo / Grade Card",
            "canonical_requirement": "Marksheet / Previous Academic Qualification",
            "keywords": ["marks memo", "mark sheet", "marksheet", "statement of marks", "grade card", "board of intermediate", "board of secondary", "cgpa", "total marks", "passed"],
            "regex": [r"statement\s*of\s*marks", r"mark\s*sheet", r"grade\s*sheet", r"cgpa", r"total\s*marks"],
            "issuing_authority": "State Board of Education / University Examination Branch"
        },
        {
            "type": "Land Ownership Document",
            "canonical_requirement": "Land Ownership Document (Khatauni / Jamabandi / Patta)",
            "keywords": ["khatauni", "jamabandi", "patta", "khasra", "bhulekh", "land record", "revenue record", "cultivable land", "holding", "survey no", "khewat"],
            "regex": [r"khatauni", r"jamabandi", r"patta\s*no", r"khasra\s*no", r"survey\s*no"],
            "issuing_authority": "State Land Revenue Department / Bhulekh Portal"
        },
        {
            "type": "Ration Card",
            "canonical_requirement": "Ration Card or Family Samagra ID",
            "keywords": ["ration card", "food & civil supplies", "nfsa", "bpl card", "antyodaya", "fair price shop", "family head", "card no"],
            "regex": [r"ration\s*card", r"food\s*(?:and|&)\s*civil\s*supplies", r"nfsa"],
            "issuing_authority": "Department of Food, Civil Supplies & Consumer Affairs"
        },
        {
            "type": "Domicile / Residence Certificate",
            "canonical_requirement": "Domicile / Residence Certificate",
            "keywords": ["domicile certificate", "residence certificate", "native of", "permanent resident", "bonafide resident", "tahsil"],
            "regex": [r"domicile\s*certificate", r"residence\s*certificate", r"permanent\s*resident"],
            "issuing_authority": "District Magistrate / Sub-Divisional Magistrate"
        }
    ]

    @classmethod
    def extract_text_from_bytes(cls, file_bytes: bytes, filename: str) -> str:
        """
        Extracts raw textual content from PDF or Image files.
        """
        lower_name = filename.lower()
        extracted_text = ""

        # 1. PDF Extraction
        if lower_name.endswith(".pdf"):
            # Try PyMuPDF (fitz) first
            try:
                import fitz
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                for page in doc:
                    extracted_text += page.get_text() + "\n"
                if extracted_text.strip():
                    return extracted_text
            except Exception:
                pass

            # Fallback to pypdf
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        extracted_text += t + "\n"
                if extracted_text.strip():
                    return extracted_text
            except Exception:
                pass

        # 2. Image Extraction
        elif any(lower_name.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(file_bytes))
                # Image metadata or OCR placeholder
                extracted_text += f"[Image file: {filename}, dimensions: {img.size[0]}x{img.size[1]} format: {img.format}]\n"
            except Exception:
                pass

        # 3. Plain Text fallback / filename analysis
        try:
            decoded = file_bytes.decode("utf-8", errors="ignore").strip()
            if decoded:
                extracted_text += "\n" + decoded
        except Exception:
            pass

        extracted_text += f"\nFile reference: {filename}\n"
        return extracted_text

    @classmethod
    def analyze_document(
        cls,
        file_bytes: bytes,
        filename: str,
        scheme_id: Optional[str] = None,
        required_documents: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes document bytes and classifies document type and requirement matching.
        """
        text = cls.extract_text_from_bytes(file_bytes, filename)
        text_lower = text.lower() + " " + filename.lower().replace("_", " ").replace("-", " ")

        best_match = None
        highest_score = 0
        detected_fields: Dict[str, Any] = {}

        for doc_sig in cls.DOCUMENT_SIGNATURES:
            match_score = 0
            # Keyword matches
            for kw in doc_sig["keywords"]:
                if kw in text_lower:
                    match_score += 15

            # Regex matches
            for reg in doc_sig["regex"]:
                if re.search(reg, text_lower, re.IGNORECASE):
                    match_score += 30

            if match_score > highest_score:
                highest_score = match_score
                best_match = doc_sig

        # If no strong text signature was found, check filename heuristically
        if not best_match or highest_score < 15:
            for doc_sig in cls.DOCUMENT_SIGNATURES:
                type_name = doc_sig["type"].lower()
                first_word = type_name.split()[0]
                if first_word in filename.lower():
                    best_match = doc_sig
                    highest_score = 40
                    break

        # Fallback if still unknown
        if not best_match or highest_score < 15:
            doc_type = "Unclassified Official Document"
            confidence = 0.45
            issuing_auth = "Competent Authority"
            matched_req = None
        else:
            doc_type = best_match["type"]
            # Confidence bounded between 0.70 and 0.98
            confidence = min(0.98, max(0.70, round(highest_score / 60.0, 2)))
            issuing_auth = best_match["issuing_authority"]
            matched_req = best_match["canonical_requirement"]

        # Extract specific detected fields with privacy masking
        detected_fields["issuing_authority"] = issuing_auth
        detected_fields["file_name"] = filename
        detected_fields["file_size_kb"] = round(len(file_bytes) / 1024, 1)

        # Aadhaar pattern detection & masking
        aadhaar_match = re.search(r"\b(\d{4}\s\d{4}\s\d{4})\b|\b(\d{12})\b", text)
        if aadhaar_match:
            raw_num = (aadhaar_match.group(1) or aadhaar_match.group(2)).replace(" ", "")
            detected_fields["masked_id"] = f"XXXX-XXXX-{raw_num[-4:]}"
        
        # PAN pattern detection
        pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", text)
        if pan_match:
            pan_str = pan_match.group(1)
            detected_fields["masked_pan"] = f"{pan_str[:2]}XXXXX{pan_str[-2:]}"

        # Date / Year extraction
        year_match = re.search(r"\b(20[12]\d)\b", text)
        if year_match:
            detected_fields["detected_year"] = year_match.group(1)

        # Income amount detection
        income_match = re.search(r"(?:rs\.?|inr|₹)\s*([\d,]+)", text_lower)
        if income_match:
            detected_fields["stated_amount"] = f"₹{income_match.group(1)}"

        # Match against scheme requirements if provided
        matched_target = None
        if required_documents and len(required_documents) > 0:
            for req in required_documents:
                r_lower = req.lower()
                if (doc_type.lower() in r_lower) or (matched_req and matched_req.lower() in r_lower) or any(k in r_lower for k in (best_match["keywords"] if best_match else [])[:3]):
                    matched_target = req
                    break
        elif matched_req:
            matched_target = matched_req

        warnings = [
            "Documents are processed for assistance and should not be treated as officially verified.",
            "CivicAid AI does not store original document files or sensitive biometric records.",
            "Ensure certificate possesses authorized digital signature or official seal before submission."
        ]

        return {
            "document_type": doc_type,
            "detected_fields": detected_fields,
            "confidence": confidence,
            "matched_requirement": matched_target,
            "warnings": warnings
        }
