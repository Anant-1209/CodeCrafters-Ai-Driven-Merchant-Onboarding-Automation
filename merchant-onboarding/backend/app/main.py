# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import HTMLResponse
# import os, uuid, zipfile, re

# app = FastAPI()

# @app.get("/health")
# def health():
#     return {"status": "ok"}

# @app.get("/", response_class=HTMLResponse)
# def index():
#     return """
#     <!doctype html>
#     <html>
#         <body>
#             <h3>Merchant Onboarding - Upload Document Pack (ZIP)</h3>
#             <input type="file" id="zip" accept=".zip"/>
#             <button onclick="send()">Upload</button>
#             <pre id="out"></pre>
#             <script>
#                 async function send(){
#                     const f = document.getElementById('zip').files[0];
#                     if(!f){
#                         alert('Choose a ZIP');
#                         return;
#                     }
#                     const fd = new FormData();
#                     fd.append('file', f);
#                     const r = await fetch('/api/upload_pack', { method:'POST', body: fd });
#                     document.getElementById('out').textContent = JSON.stringify(await r.json(), null, 2);
#                 }
#             </script>
#         </body>
#     </html>
#     """

# PAN_RE   = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
# GSTIN_RE = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[A-Z0-9]\b")
# CIN_RE   = re.compile(r"\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b")
# IFSC_RE  = re.compile(r"\b[A-Z]{4}0\d{6}\b")
# AADHAAR_MASK_RE = re.compile(r"\bX{4}-X{4}-\d{4}\b", re.IGNORECASE)
# DATE_RE  = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")

# def read_text(path: str) -> str:
#     # Demo: only read plain text files
#     ext = os.path.splitext(path)[1].lower()
#     if ext == ".txt":
#         for enc in ["utf-8", "latin-1"]:
#             try:
#                 with open(path, "r", encoding=enc, errors="ignore") as f:
#                     return f.read()
#             except Exception:
#                 continue
#     return ""

# def classify_and_extract(text: str, filename: str):
#     text_u = text.upper()
#     info = {"filename": filename, "doc_type": "UNKNOWN", "fields": {}, "notes": []}
#     # PAN
#     pan = PAN_RE.search(text_u)
#     if "PAN" in text_u or pan:
#         info["doc_type"] = "PAN"
#         if pan:
#             info["fields"]["pan"] = pan.group(0)
#         m = re.search(r"NAME\s*:\s*([A-Z][A-Z\s\.]+)", text_u)
#         if m:
#             info["fields"]["name"] = m.group(1).strip()

#     # GST
#     gst = GSTIN_RE.search(text_u)
#     if "GSTIN" in text_u or gst:
#         info["doc_type"] = "GST"
#         if gst:
#             info["fields"]["gstin"] = gst.group(0)
#         m = re.search(r"LEGAL\s*NAME\s*:\s*([A-Z][A-Z\s\.&]+)", text_u)
#         if m:
#             info["fields"]["legal_name"] = m.group(1).strip()

#     # CIN / Incorporation
#     cin = CIN_RE.search(text_u)
#     if "CIN" in text_u or "INCORPORATION" in text_u or cin:
#         info["doc_type"] = "INCORPORATION"
#         if cin:
#             info["fields"]["cin"] = cin.group(0)
#         dt = DATE_RE.search(text)
#         if dt:
#             info["fields"]["incorporation_date"] = dt.group(0)

#     # Director ID (Aadhaar masked)
#     aad = AADHAAR_MASK_RE.search(text)
#     if "AADHAAR" in text_u or "DIRECTOR" in text_u or aad:
#         info["doc_type"] = "DIRECTOR_ID"
#         if aad:
#             info["fields"]["aadhaar_masked"] = aad.group(0)
#         m = re.search(r"DIRECTOR\s*:\s*([A-Z][A-Z\s\.]+)", text_u)
#         if m:
#             info["fields"]["director_name"] = m.group(1).strip()

#     # Bank statement
#     if "IFSC" in text_u or "BANK" in text_u:
#         info["doc_type"] = "BANK"
#         ifsc = IFSC_RE.search(text_u)
#         if ifsc:
#             info["fields"]["ifsc"] = ifsc.group(0)
#         m = re.search(r"ACCT\s*:\s*([0-9\- ]{6,})", text_u)
#         if m:
#             acct = re.sub(r"\D", "", m.group(1))
#             info["fields"]["account_number"] = acct
#         m = re.search(r"BANK\s*:\s*([A-Z][A-Z\s&]+)", text_u)
#         if m:
#             info["fields"]["bank_name"] = m.group(1).strip()

#     return info

# def process_case(work_case_dir: str):
#     results = []
#     for root, _, fnames in os.walk(work_case_dir):
#         for n in fnames:
#             fp = os.path.join(root, n)
#             txt = read_text(fp)
#             info = classify_and_extract(txt, os.path.relpath(fp, work_case_dir))
#             if not txt:
#                 info["notes"].append("no_text_or_unsupported_file")
#             results.append(info)
#     # Presence check
#     present = {d["doc_type"] for d in results}
#     required = {"PAN", "GST", "INCORPORATION", "DIRECTOR_ID", "BANK"}
#     missing = sorted(list(required - present))

#     # Aggregate fields
#     fields = {}
#     for d in results:
#         for k, v in d["fields"].items():
#             if k not in fields and v:
#                 fields[k] = v

#     # Risk scoring
#     reasons = []
#     score = 100
#     for m in missing:a
#         reasons.append(f"Missing {m} (-25)")
#         score -= 25

#     if "pan" in fields:
#         if not PAN_RE.fullmatch(fields["pan"]):
#             reasons.append("PAN format invalid (-10)")
#             score -= 10
#     else:
#         reasons.append("PAN not found (-10)")
#         score -= 10

#     if "gstin" in fields:
#         if not GSTIN_RE.fullmatch(fields["gstin"]):
#             reasons.append("GSTIN format invalid (-10)")
#             score -= 10
#     else:
#         reasons.append("GSTIN not found (-10)")
#         score -= 10

#     if "cin" in fields:
#         if not CIN_RE.fullmatch(fields["cin"]):
#             reasons.append("CIN format possibly invalid (-5)")
#             score -= 5
#     else:
#         reasons.append("CIN not found (-5)")
#         score -= 5

#     if "ifsc" in fields:
#         if not IFSC_RE.fullmatch(fields["ifsc"]):
#             reasons.append("IFSC format invalid (-10)")
#             score -= 10
#     else:
#         reasons.append("IFSC not found (-10)")
#         score -= 10

#     pan_name = fields.get("name")
#     dir_name = fields.get("director_name")
#     if pan_name and dir_name:
#         if pan_name.strip() == dir_name.strip():
#             reasons.append("Director name matches PAN (+10)")
#             score += 10
#         else:
#             reasons.append("Director name mismatch with PAN (-10)")
#             score -= 10

#     score = max(0, min(100, score))
#     return {
#         "docs": results,
#         "summary_fields": fields,
#         "missing_docs": missing,
#         "risk_score": score,
#         "reasons": reasons,
#     }

# @app.post("/api/upload_pack")
# async def upload_pack(file: UploadFile = File(...)):
#     case_id = str(uuid.uuid4())
#     incoming_dir = os.path.join("data", "incoming")
#     work_case_dir = os.path.join("data", "work", case_id)
#     os.makedirs(incoming_dir, exist_ok=True)
#     os.makedirs(work_case_dir, exist_ok=True)
#     zip_path = os.path.join(incoming_dir, f"{case_id}.zip")
#     with open(zip_path, "wb") as f:
#         f.write(await file.read())
#     with zipfile.ZipFile(zip_path, "r") as z:
#         z.extractall(work_case_dir)
#     # Build file list and analysis
#     files = []
#     for r, _, fns in os.walk(work_case_dir):
#         for n in fns:
#             files.append(os.path.relpath(os.path.join(r, n), work_case_dir))

#     analysis = process_case(work_case_dir)
#     return {"case_id": case_id,

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
import os, uuid, zipfile, re, requests, json
from rapidfuzz import fuzz

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def index():
    return """
    <!doctype html>
    <html>
    <body>
        <h3>Merchant Onboarding - Upload Document Pack (ZIP)</h3>
        <input type="file" id="zip" accept=".zip"/>
        <button onclick="send()">Upload</button>
        <pre id="out"></pre>
        <script>
        async function send(){
            const f = document.getElementById('zip').files[0];
            if(!f){ alert('Choose a ZIP'); return; }
            const fd = new FormData();
            fd.append('file', f);
            const r = await fetch('/api/upload_pack', { method:'POST', body: fd });
            document.getElementById('out').textContent = JSON.stringify(await r.json(), null, 2);
        }
        </script>
    </body>
    </html>
    """


# Regex patterns (India)
PAN_RE   = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
GSTIN_RE = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[A-Z0-9]\b")
CIN_RE   = re.compile(r"\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b")
IFSC_RE  = re.compile(r"\b[A-Z]{4}0\d{6}\b")
AADHAAR_MASK_RE = re.compile(r"\bX{4}-X{4}-\d{4}\b", re.IGNORECASE)
DATE_RE  = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")

SANCTIONS_LOCAL = [
    "JOHN DOE", "RAVI SHARMA (PEP)", "SANCTIONED PERSON A"
]


def read_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".txt":
        for enc in ["utf-8", "latin-1"]:
            try:
                with open(path, "r", encoding=enc, errors="ignore") as f:
                    return f.read()
            except Exception:
                continue
    return ""


def classify_and_extract(text: str, filename: str):
    text_u = text.upper()
    info = {"filename": filename, "doc_type": "UNKNOWN", "fields": {}, "notes": []}

    # PAN
    pan = PAN_RE.search(text_u)
    if "PAN" in text_u or pan:
        info["doc_type"] = "PAN"
        if pan:
            info["fields"]["pan"] = pan.group(0)
        m = re.search(r"NAME\s*:\s*([A-Z][A-Z\s\.]+)", text_u)
        if m:
            info["fields"]["name"] = m.group(1).strip()

    # GST
    gst = GSTIN_RE.search(text_u)
    if "GSTIN" in text_u or gst:
        info["doc_type"] = "GST"
        if gst:
            info["fields"]["gstin"] = gst.group(0)
        m = re.search(r"LEGAL\s*NAME\s*:\s*([A-Z][A-Z\s\.&]+)", text_u)
        if m:
            info["fields"]["legal_name"] = m.group(1).strip()

    # CIN / Incorporation
    cin = CIN_RE.search(text_u)
    if "CIN" in text_u or "INCORPORATION" in text_u or cin:
        info["doc_type"] = "INCORPORATION"
        if cin:
            info["fields"]["cin"] = cin.group(0)
        dt = DATE_RE.search(text)
        if dt:
            info["fields"]["incorporation_date"] = dt.group(0)

    # Director ID (Aadhaar masked)
    aad = AADHAAR_MASK_RE.search(text)
    if "AADHAAR" in text_u or "DIRECTOR" in text_u or aad:
        info["doc_type"] = "DIRECTOR_ID"
        if aad:
            info["fields"]["aadhaar_masked"] = aad.group(0)
        m = re.search(r"DIRECTOR\s*:\s*([A-Z][A-Z\s\.]+)", text_u)
        if m:
            info["fields"]["director_name"] = m.group(1).strip()

    # Bank statement
    if "IFSC" in text_u or "BANK" in text_u:
        info["doc_type"] = "BANK"
        ifsc = IFSC_RE.search(text_u)
        if ifsc:
            info["fields"]["ifsc"] = ifsc.group(0)
        m = re.search(r"ACCT\s*:\s*([0-9\- ]{6,})", text_u)
        if m:
            acct = re.sub(r"\D", "", m.group(1))
            info["fields"]["account_number"] = acct
        m = re.search(r"BANK\s*:\s*([A-Z][A-Z\s&]+)", text_u)
        if m:
            info["fields"]["bank_name"] = m.group(1).strip()

    return info


# ---------- Verifications ----------
BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
VALS = {c: i for i, c in enumerate(BASE36)}


def gstin_checksum_ok(gstin: str) -> bool:
    g = gstin.strip().upper()
    if len(g) != 15 or not GSTIN_RE.fullmatch(g):
        return False
    total = 0
    for i, ch in enumerate(g[:14]):
        val = VALS.get(ch, -1)
        if val < 0:
            return False
        factor = 1 if (i % 2 == 0) else 2
        prod = val * factor
        total += (prod // 36) + (prod % 36)
    check_index = (36 - (total % 36)) % 36
    return BASE36[check_index] == g[14]


def gstin_expected_last_char(gstin14: str) -> str:
    g = gstin14.strip().upper()
    total = 0
    for i, ch in enumerate(g):
        val = VALS[ch]
        factor = 1 if (i % 2 == 0) else 2
        prod = val * factor
        total += (prod // 36) + (prod % 36)
    check_index = (36 - (total % 36)) % 36
    return BASE36[check_index]


def pan_in_gstin(gstin: str) -> str | None:
    g = gstin.strip().upper()
    if len(g) == 15:
        return g[2:12]
    return None


def verify_ifsc_online(ifsc: str, timeout=3):
    try:
        r = requests.get(f"https://ifsc.razorpay.com/{ifsc}", timeout=timeout)
        if r.status_code == 200:
            return True, r.json()
        return False, None
    except Exception:
        return False, None


def name_match(a: str | None, b: str | None) -> int:
    if not a or not b:
        return 0
    return int(fuzz.token_set_ratio(a.upper(), b.upper()))


def normalize_bank_name(s: str | None) -> str:
    if not s:
        return ""
    s = s.upper().replace(" LTD", "").replace(" LIMITED", "").strip()
    s = s.replace("BANK LTD", "BANK").replace("BANK LIMITED", "BANK")
    return s


def sanctions_hit(name: str | None) -> bool:
    if not name:
        return False
    for bad in SANCTIONS_LOCAL:
        if fuzz.token_set_ratio(name.upper(), bad.upper()) >= 90:
            return True
    return False


MH_STATE_CODES = {"27"}  # Maharashtra for Pune demo


def process_case(work_case_dir: str):
    results = []
    for root, _, fnames in os.walk(work_case_dir):
        for n in fnames:
            fp = os.path.join(root, n)
            txt = read_text(fp)
            info = classify_and_extract(txt, os.path.relpath(fp, work_case_dir))
            if not txt:
                info["notes"].append("no_text_or_unsupported_file")
            results.append(info)

    present = {d["doc_type"] for d in results}
    required = {"PAN", "GST", "INCORPORATION", "DIRECTOR_ID", "BANK"}
    missing = sorted(list(required - present))

    F = {}
    for d in results:
        for k, v in d["fields"].items():
            if k not in F and v:
                F[k] = v

    ver = {
        "gstin_checksum_ok": None,
        "gstin_expected_last_char": None,
        "gstin_pan_match": None,
        "gstin_state_ok": None,
        "ifsc_valid": None,
        "ifsc_bank_match": None,
        "pan_director_name_match": None,
        "sanctions_director": None
    }

    reasons = []
    score = 100

    for m in missing:
        reasons.append(f"Missing {m} (-25)")
        score -= 25

    # GSTIN checks
    if "gstin" in F:
        g = F["gstin"].upper()
        ok = gstin_checksum_ok(g)
        ver["gstin_checksum_ok"] = ok
        expected = gstin_expected_last_char(g[:14])
        ver["gstin_expected_last_char"] = expected
        if not ok:
            reasons.append(f"GSTIN checksum invalid; expected last char {expected} (-20)")
            score -= 20
        state_ok = g[:2] in MH_STATE_CODES
        ver["gstin_state_ok"] = state_ok
        if not state_ok:
            reasons.append(f"GSTIN state code {g[:2]} not Maharashtra (-5)")
            score -= 5
        embedded_pan = pan_in_gstin(g)
        if "pan" in F and embedded_pan:
            ver["gstin_pan_match"] = (embedded_pan == F["pan"].upper())
            if ver["gstin_pan_match"]:
                reasons.append("PAN matches GSTIN (+10)")
                score += 10
            else:
                reasons.append("PAN does not match GSTIN (-15)")
                score -= 15
        elif embedded_pan:
            reasons.append("PAN missing but present in GSTIN (-5)")
            score -= 5
    else:
        reasons.append("GSTIN not found (-10)")
        score -= 10

    # PAN format
    if "pan" in F:
        if not PAN_RE.fullmatch(F["pan"].upper()):
            reasons.append("PAN format invalid (-10)")
            score -= 10
    else:
        reasons.append("PAN not found (-10)")
        score -= 10

    # CIN format
    if "cin" in F:
        if not CIN_RE.fullmatch(F["cin"].upper()):
            reasons.append("CIN format possibly invalid (-5)")
            score -= 5
    else:
        reasons.append("CIN not found (-5)")
        score -= 5

    # IFSC + bank match (fuzzy)
    if "ifsc" in F:
        valid, ifsc_data = verify_ifsc_online(F["ifsc"].upper())
        ver["ifsc_valid"] = valid
        if valid:
            reasons.append("IFSC valid (+5)")
            score += 5
            doc_bank = normalize_bank_name(F.get("bank_name"))
            api_bank = normalize_bank_name(ifsc_data.get("BANK") if ifsc_data else "")
            if doc_bank and api_bank:
                sim = name_match(doc_bank, api_bank)
                ver["ifsc_bank_match"] = (sim >= 85)
                if sim >= 85:
                    reasons.append("Bank name matches IFSC (+5)")
                    score += 5
                else:
                    reasons.append(f"Bank name mismatch: doc={F.get('bank_name')}, api={ifsc_data.get('BANK')} (-10)")
                    score -= 10
        else:
            reasons.append("IFSC not found/invalid (-15)")
            score -= 15
    else:
        reasons.append("IFSC not found (-10)")
        score -= 10

    # Names consistency
    pan_name = F.get("name")
    dir_name = F.get("director_name")
    if pan_name and dir_name:
        sim = name_match(pan_name, dir_name)
        ver["pan_director_name_match"] = sim
        if sim >= 85:
            reasons.append("Director name matches PAN (+10)")
            score += 10
        elif sim >= 60:
            reasons.append("Director name partially matches PAN (-5)")
            score -= 5
        else:
            reasons.append("Director name mismatch with PAN (-10)")
            score -= 10

    # Sanctions/PEP local
    if sanctions_hit(dir_name or pan_name):
        ver["sanctions_director"] = True
        reasons.append("Sanctions/PEP hit (-100)")
        score -= 100
    else:
        ver["sanctions_director"] = False

    score = max(0, min(100, score))

    # Decision + fix suggestions
    must_pass_failures = []
    fixes = []
    if not ver["gstin_checksum_ok"]:
        must_pass_failures.append("GSTIN checksum")
        fixes.append(f"Fix GSTIN check-digit to {ver['gstin_expected_last_char']} and re-upload")
    if ver["gstin_pan_match"] is False:
        must_pass_failures.append("PAN↔GSTIN mismatch")
        fixes.append("Ensure PAN on PAN doc matches PAN embedded in GSTIN")
    if not ver["ifsc_valid"]:
        must_pass_failures.append("IFSC invalid")
        fixes.append("Provide a valid IFSC or update bank details")
    if ver["ifsc_bank_match"] is False:
        must_pass_failures.append("Bank name mismatch")
        fixes.append("Bank name on statement must match IFSC bank (e.g., 'HDFC BANK')")
    if ver["sanctions_director"]:
        must_pass_failures.append("Sanctions/PEP hit")
        fixes.append("Escalate to compliance; cannot auto-approve")
    if ver["pan_director_name_match"] is not None and ver["pan_director_name_match"] < 85:
        fixes.append("Director name should match PAN name (minor spelling differences allowed)")

    if must_pass_failures:
        decision = "DECLINE"
    elif score >= 80:
        decision = "AUTO_APPROVE"
    else:
        decision = "REVIEW"

    return {
        "docs": results,
        "summary_fields": F,
        "missing_docs": missing,
        "verifications": ver,
        "risk_score": score,
        "reasons": reasons,
        "decision": decision,
        "fix_suggestions": fixes,
        "must_pass_failures": must_pass_failures
    }


@app.post("/api/upload_pack")
async def upload_pack(file: UploadFile = File(...)):
    case_id = str(uuid.uuid4())
    incoming_dir = os.path.join("data", "incoming")
    work_case_dir = os.path.join("data", "work", case_id)
    os.makedirs(incoming_dir, exist_ok=True)
    os.makedirs(work_case_dir, exist_ok=True)

    zip_path = os.path.join(incoming_dir, f"{case_id}.zip")
    with open(zip_path, "wb") as f:
        f.write(await file.read())

    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(work_case_dir)

    files = []
    for r, _, fns in os.walk(work_case_dir):
        for n in fns:
            files.append(os.path.relpath(os.path.join(r, n), work_case_dir))

    analysis = process_case(work_case_dir)

    # Save audit JSON
    audit_path = os.path.join(work_case_dir, "audit.json")
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump({"case_id": case_id, "files": files, "analysis": analysis},
                  f, ensure_ascii=False, indent=2)

    return {
        "case_id": case_id,
        "files": files,
        "analysis": analysis,
        "audit_url": f"/api/case/{case_id}/audit"
    }


@app.get("/api/case/{case_id}/audit")
def get_audit(case_id: str):
    p = os.path.join("data", "work", case_id, "audit.json")
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return JSONResponse(content=json.load(f))
    return JSONResponse(status_code=404, content={"error": "not found"})
