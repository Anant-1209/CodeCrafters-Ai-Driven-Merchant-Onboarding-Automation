import os, zipfile, random
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = "sample_pack"
os.makedirs(OUT_DIR, exist_ok=True)

def card(text, name):
img = Image.new("RGB", (1000, 650), "white")
d = ImageDraw.Draw(img)
try:
font = ImageFont.truetype("DejaVuSans.ttf", 28)
except:
font = ImageFont.load_default()
d.text((40,40), text, fill="black", font=font)
img.save(os.path.join(OUT_DIR, name))

pan = f"PAN: ABCDE{random.randint(1000,9999)}F | Name: RAVI KUMAR | DoB: 1990-05-10"
gst = f"GSTIN: 27ABCDE1234F1Z{random.randint(0,9)} | Legal Name: RAVI TRADERS"
cin = f"CIN: U12345MH20{random.randint(10,24)}PTC012345 | Incorporation: 2021-08-01"
dir_id = f"Aadhaar: XXXX-XXXX-{random.randint(1000,9999)} | Director: RAVI KUMAR"
bank = f"Bank: HDFC | Acct: 50100{random.randint(10000,99999)} | IFSC: HDFC0001234"

card(pan, "PAN.png")
card(gst, "GST.png")
card(cin, "Incorporation.png")
card(dir_id, "DirectorID.png")
card(bank, "BankStatement.png")

with zipfile.ZipFile("sample_pack.zip", "w", zipfile.ZIP_DEFLATED) as z:
for fn in os.listdir(OUT_DIR):
z.write(os.path.join(OUT_DIR, fn), fn)
print("Created sample_pack.zip")
