#!/bin/env python3

"""This script takes in a song or directory, converts all songs to .mp3, and wipes any non-basic, potentially identifying tags, from their metadata."""

import os
import re
import subprocess
import argparse
from mutagen.id3 import ID3, APIC, TIT2, TPE1, TRCK, TALB, USLT, TYER, TORY, TDRC, TCON, ID3NoHeaderError

# ID3 info:
# APIC: picture
# TIT2: title
# TPE1: artist
# TRCK: track number
# TALB: album
# USLT: lyrics
# TDRC: date
# TYER: year
# TORY: original release year
# TCON: genre

def check_filetype(path):
    # Don't match hidden files
    if os.path.basename(path).startswith("."):
        return False

    # Prevent anything other than audio from being selected
    return re.match(r'(.*\.)(mp3|wav|wma|ogg|mpeg|m4a|opus|flac|ac3|adx|aiff|alaw|alsa|amr|apng|asf|ass|ast|au|avi|bit|caf|cavsvideo|data|daud|dirac|dnxhd|dts|dv|eac3|fbdev|ffm|ffmetadata|filmstrip|flv|h264|hevc|m4v|mlp|mpeg|mpegts|oss|pulse|truehd|tta|webm|wv)$', path, re.I) # case insensitive match

def get_tag(audio, key):
    # Try to extract the tag. If unsuccessful return empty string

    # If we're looking for the year and TYER tag doesn't exist,
    # determine year from the TDRC (date) tag
    if (key == 'TYER' and 'TYER' not in audio):
        try:
            return audio['TDRC'].text[0].text[0:4]
        except:
            return ""
    if (key == 'TDRC'):
        try:
            return audio['TDRC'].text[0].text
        except:
            return ""
    if (key == 'APIC:'):
        try:
            return audio['APIC:'].data
        except:
            return ""

    try:
        return audio[key].text[0]
    except:
        return ""

def clean_metadata(path):
    filename, filetype = os.path.splitext(path)
    try:
        origfile = ID3(path)
    except:
        origfile = ID3()

    # Save essential metadata
    artist = get_tag(origfile, 'TPE1')
    album = get_tag(origfile, 'TALB')
    title = get_tag(origfile, 'TIT2')
    genre = get_tag(origfile, 'TCON')
    track_num = get_tag(origfile, 'TRCK')
    year = get_tag(origfile, 'TYER')
    date = get_tag(origfile, 'TDRC')
    lyrics = get_tag(origfile, 'USLT')
    art = get_tag(origfile, 'APIC:')

    # Rename dirty file
    dirty_filepath = filename+"-dirty.mp3"
    os.rename(path, dirty_filepath)

    # Create new file with no tags
    subprocess.check_output(['ffmpeg', '-hide_banner', '-i', dirty_filepath, '-map_metadata', '-1', '-c:v', 'copy', '-c:a', 'copy', path])

    # Apply desired tags to new file
    try:
        cleanfile = ID3(path)
    except ID3NoHeaderError:
        cleanfile = ID3()

    if artist != "":    cleanfile.add(TPE1(encoding=3, text=artist))
    if album != "":     cleanfile.add(TALB(encoding=3, text=album))
    if title != "":     cleanfile.add(TIT2(encoding=3, text=title))
    if genre != "":     cleanfile.add(TCON(encoding=3, text=genre))
    if track_num != "": cleanfile.add(TRCK(encoding=3, text=track_num))
    if date != "":      cleanfile.add(TDRC(encoding=3, text=date))
    if year != "":      cleanfile.add(TYER(encoding=3, text=year))
    if year != "":      cleanfile.add(TORY(encoding=3, text=year))
    if lyrics != "":    cleanfile.add(USLT(encoding=3, text=lyrics))
    if art != "":       cleanfile.add(APIC(encoding=3, mime='image/jpeg', type=3, desc=u'Cover', data=art))
    cleanfile.save(path, v2_version=3)

    # Delete old, dirty file
    os.remove(dirty_filepath)

def convert_song(path):
    # Check if file is already mp3. If so, return
    filename, filetype = os.path.splitext(path)
    output_filename = filename + ".mp3"
    if filetype.lower() == '.mp3':
        return output_filename

    # Convert song to mp3 file format
    subprocess.check_output(['ffmpeg', '-hide_banner', '-i', path, '-ab', '320k', '-map_metadata', '0', '-id3v2_version', '3', output_filename])

    # Remove original file
    os.remove(path)
    return output_filename

# Set up argument parsing
parser = argparse.ArgumentParser(description='Clean potentially identifiable information from audio metadata.')
parser.add_argument("path", help="Path to song file or directory containing song files")
args = parser.parse_args()
path = os.path.abspath(args.path)

# Appease stupid windows
if path.endswith('"'):
    path = path[:-1]

# Get music files specified on the commandline
files_to_process = []
if os.path.isfile(path):
    # Single file specified
    if check_filetype(path):
        files_to_process.append(path)
else:
    # Directory specified, iterate through contained files
    for root, directories, filenames in os.walk(path):
        for filename in filenames:
            filepath = os.path.join(root, filename)
            if os.path.isfile(filepath) and check_filetype(filepath):
                # Add path to list if it is a file
                files_to_process.append(filepath)

if len(files_to_process) == 0:
    print("No song files found.")

# Iterate through files
for filepath in files_to_process:
    print("PROCESSING:", filepath)
    filepath = convert_song(filepath)
    clean_metadata(filepath)
