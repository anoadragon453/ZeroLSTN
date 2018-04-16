# Cleantags.py

This is a script to remove all but the most essential metadata from your song files.

## Warning!

**It is recommended to make a backup on your music before running this script! It WILL convert all your music to mp3, and it WILL wipe all non-essential metadata!**

Programs such as iTunes can include information such as your username or email
address within the song file, making it trivial to trace your music back to you
once you've uploaded it. This script will wipe all song information that isn't
used on ZeroLSTN from your song files.

## Dependencies

* `python3`
* `ffmpeg`
* `mutagen` (`apt install python3-mutagen`/`pip3 install mutagen`)

## Usage

```
# for a directory
python3 ./cleantags.py ./Music

# for a single song
python3 ./cleantags.py ./mysong.mp3
```

## Supported Tags

`cleantags.py` will wipe all song tags in your files except for the following:

* `title`
* `album`
* `artist`
* `tracknumber`
* `album art`
* `genre`
* `date`
