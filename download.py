import urllib.request
import os

urls = [
    "https://raw.githubusercontent.com/Yemnamehmood/Birthday-wish-with-music-player/main/happy-birthday-155461.mp3",
    "https://raw.githubusercontent.com/Yemnamehmood/Birthday-wish-with-music-player/master/happy-birthday-155461.mp3",
    "https://raw.githubusercontent.com/wikivky/hbd/master/hbd.mp3",
    "https://raw.githubusercontent.com/wikivky/hbd/main/hbd.mp3"
]

print("Starting download script...")
downloaded = False
for url in urls:
    try:
        print(f"Trying to download from: {url}")
        urllib.request.urlretrieve(url, "happy-birthday.mp3")
        # Check if the file size is reasonable (e.g. > 100kb)
        if os.path.exists("happy-birthday.mp3") and os.path.getsize("happy-birthday.mp3") > 50000:
            print("Successfully downloaded and verified happy-birthday.mp3!")
            downloaded = True
            break
        else:
            print("File too small or not found, trying next URL.")
    except Exception as e:
        print(f"Failed to download from this URL: {e}")

if not downloaded:
    print("Error: All download URLs failed.")
    exit(1)
else:
    exit(0)
