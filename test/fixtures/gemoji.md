---
layout: post
title: Phone Call Visualisation
---

Given a call history file, generate an image showing all calls with their time, duration, and type. Okay, the wording I used might make this sound like homework...
Nope, this is just something I wanted to see and share with the person on the other end of these calls :telephone:

## Export Call History

The first thing I did was export my call history as an XML file from my phone. I used the Android app [Call Log Backup & Restore](https://play.google.com/store/apps/details?id=com.tekxperiastudios.callloganalyser) to generate the file and copied it over to my PC. However, this week I tried installing it on my new phone and it immediately crashes on launch... :skull:

The [Call Logs Backup](https://play.google.com/store/apps/details?id=com.loopvector.allinonebackup.calllogsbackup) app exports a similarly structured XML file deceptively using the file extension `.aiob` that we can use... without having to pay for the pro version :innocent:

## Call History File Formats

Call Log Backup & Restore `.xml`

```xml
<callLogBackUp>
  <callLog>
    <phoneNumber>+1206xxxxxxx</phoneNumber>
    <dateTime>1601778573466</dateTime>
    <callDuration>93</callDuration>
    <logType>2</logType>
  </callLog>
<callLogBackUp>
```

Call Logs Backup `.aiob`

```xml
<AllInOneBackup>
  <File>
    <Data>
      <Datum>
        <PhoneNumber>+1206xxxxxx</PhoneNumber>
        <Timestamp>1601778573466</Timestamp>
        <Duration>93</Duration>
        <CallType>2</CallType>
      </Datum>
    </Data>
  </File>
</AllInOneBackup>
```

The `dateTime` and `Timestamp` fields are milliseconds since the [Unix Epoch](https://www.unixtimestamp.com). The `callDuration` and `Duration` fields are how many seconds the call lasted. Finally, the `logType` and `CallType` correspond to what type of call it was, which are listed below.

| Value | Call Type                                                |
| ----- | -------------------------------------------------------- |
| 1     | <span style = "color:#2ECC71">Incoming</span>            |
| 2     | <span style = "color:#3498DB">Outgoing</span>            |
| 3     | <span style = "color:#E67E22">Missed</span>              |
| 4     | <span style = "color:#95A5A6">Voicemail</span>           |
| 5     | <span style = "color:#E74C3C">Rejected</span>            |
| 6     | <span style = "color:#9B59B6">Blocked</span>             |
| 7     | <span style = "color:#F1C40F">Answered Externally</span> |

_Colour palette provided by [Flat UI Colours](https://flatuicolors.com/palette/defo)_

## Parsing XML

The first thing to do is parse the XML file into a list of objects that are more friendly to work with.\
These objects will look like this:

```python
class CallData:
  def __init__(self, number: str, start: datetime, end: datetime, call_type: CallType):
    self.number = number[-10:] # Excludes country code e.g. +1
    self.start = start
    self.end = end
    self.call_type = call_type
    self.duration = self.end - self.start
```

Using Python's [ElementTree XML API](https://docs.python.org/3/library/xml.etree.elementtree.html) I load the file content and iterate through all elements. Each `callLog` or `Datum` element will result in a `CallData` object being constructed. The element's fields are transformed so the constructor can be called with the proper data types.

```python
def _parse_xml(data):
  result = []

  xml_data = ET.canonicalize(data, strip_text=True)
  root = ET.fromstring(xml_data)
  for child in root:
    number = child.findtext('phoneNumber')
    start = datetime.fromtimestamp(int(child.findtext('dateTime')) / 1000)
    end = start + timedelta(0, int(child.findtext('callDuration')))
    call_type = CallType(int(child.findtext('logType')))
    result.append(CallData(number, start, end, call_type))

  return result
```

_There is a similar version of this function for the other possible file types_

## Manually Exporting Call History

Ideally, you don't want to let an application read your call history for privacy reasons. I'm not an Android developer, but I'll try my best to export my call history with my bare hands :bear:.
The included `Phone` application doesn't provide a way to do this, thanks Google :unamused:

So, I went to the World Wide Web... surfing for answers :surfer:

I realised after searching the file system and trying to use `sqlite3` via `adb` to read the internal call log database that both require a rooted phone. Okay, well I'll keep this [Pixel 4a (5G) Root Guide](https://forum.xda-developers.com/t/guide-root-pixel-4a-5g-android-12.4221133/) handy in case I go down that route, I'd rather not though... been there, done that, back in 2014 :bug:

After hours of trying to avoid using the third-party exporters I descended into madness and was considering insane ways to get the call history data _that I so desperately needed_. Namely, stitching together a bunch of screenshots programmatically via `adb` commands, then analysing that with [OCR](https://en.wikipedia.org/wiki/Optical_character_recognition) and using [template matching](https://en.wikipedia.org/wiki/Template_matching) for any icons. And, if that doesn't sound like over-engineering :fearful:

This project was originally done in a few hours and now I'm blowing it up, but like, in a fun way, ya know... :bomb: :sparkles:

### Android App

I ended up finding enough resources online thanks to YouTube tutorials, Android documentation, and public GitHub repositories of similar applications to be able to create my own app! As I said earlier, I haven't really done any Android development so this is likely far from perfect, but hey, it works :relieved:

#### Permissions

Gaining permissions to read call history and write to storage is done by adding the following elements to the root of the XML document `/app/manifest/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.READ_CALL_LOG" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

I think I did this in the worst way possible since I didn't follow this [Requesting App Permissions](https://developer.android.com/training/permissions/requesting) :pensive:

#### Reading Call History

To get the call history we use `contentResolver` to query `content://call_log/calls` and specify which columns are required. We can iterate over the returned `Cursor` object and get each of the columns we specified earlier using their proper data types.

```kotlin
val columns = arrayOf(Calls.NUMBER, Calls.DATE, Calls.DURATION, Calls.TYPE)
val cursor = contentResolver.query(Calls.CONTENT_URI, columns, null, null)

val numberIndex = cursor.getColumnIndex(Calls.NUMBER)
val dateIndex = cursor.getColumnIndex(Calls.DATE)
val durationIndex = cursor.getColumnIndex(Calls.DURATION)
val typeIndex = cursor.getColumnIndex(Calls.TYPE)

while (cursor.moveToNext()) {
  val number = cursor.getString(numberIndex)
  val startMilliseconds = cursor.getLong(dateIndex)
  val durationSeconds = cursor.getLong(durationIndex)
  val type = cursor.getInt(typeIndex)
}
```

#### Using Protocol Buffers

I decided on using [Protocol Buffers](https://developers.google.com/protocol-buffers/) for serialising my structured data. I could have copied one of the existing XML formats, but that'd be no fun! I learned about protocol buffers when I worked started working for Microsoft Edge in June 2019 since that's the format Google Chrome uses for its experiments.

```proto
syntax = "proto3";

import "google/protobuf/duration.proto";
import "google/protobuf/timestamp.proto";

message Call {
    string number = 1;
    google.protobuf.Timestamp start = 2;
    google.protobuf.Duration duration = 3;

    enum CallType {
        Incoming = 0;
        Outgoing = 1;
        Missed = 2;
        Voicemail = 3;
        Rejected = 4;
        Blocked = 5;
        AnsweredExternally = 6;
    }

    CallType type = 4;
}

message CallHistory {
    repeated Call calls = 1;
}
```

Funnily enough, a phone book is the example used in the [Protocol Buffer Tutorial](https://developers.google.com/protocol-buffers/docs/kotlintutorial) :laughing:

I followed this [Android Protobuf Tutorial](https://medium.com/mobile-app-development-publication/simple-android-protobuf-tutorial-with-actual-code-bfb581299f47) to set up my Android project to work with protocol buffers. Since my `.proto` file imports some special data types I also had to copy those to my Android project.

The code is merged with the earlier snippet; using the column data to construct a `CallHistory` object

```kotlin
val historyBuilder = calls.Calls.CallHistory.newBuilder()

while (cursor.moveToNext()) {
  historyBuilder.addCalls(calls.Calls.Call.newBuilder().apply {
    this.number = number
    this.start = Timestamp.newBuilder().setSeconds(startMilliseconds / 1000).build()
    this.duration = Duration.newBuilder().setSeconds(durationSeconds).build()
    this.type = calls.Calls.Call.CallType.forNumber(type)
  }.build())
}

val history = historyBuilder.build()
```

#### Writing the File

Android has the concept of internal and external storage. The naming is slightly confusing. Each app has internal storage specific to them, that only they can access. External storage is the public directories on the Android device. We need to write to the external storage so users can copy the file from their `Download` directory to their PC.

Writing the file is simplified by using the generated Protobuf class's `writeTo(FileOutputStream)` function. Make sure to close the `FileOutputStream` and show the user a message saying where it wrote the file to.

```kotlin
val filename = "call-history.bin"
val directory = Environment.DIRECTORY_DOWNLOADS
val file = File(Environment.getExternalStoragePublicDirectory(directory), filename)
val fos = FileOutputStream(file)
history.writeTo(fos)
fos.close()
Toast.makeText(this, "Saved: ${directory}/$filename", Toast.LENGTH_LONG).show()
```

Note: `Environment.getExternalStoragePublicDirectory` was deprecated in Android Q.

#### GUI

I have some very strong opinions about the UI and UX in programs I use on the daily. However, there's really not much to this app, so I'm taking the minimalist approach and making it a single button. Adding a click listener to that button that does the export is the final step to completing this simple application.

```kotlin
val exportButton: Button = findViewById(R.id.exportButton)
exportButton.setOnClickListener {
  // Export Call History Code
}
```

Once I figured out all the necessary parts and how to set them up in Android Studio, it was all the smoothiest of sailing from there :sailboat:

View the full source code [here](https://github.com/mic-max/call-history-exporter) on my GitHub.

## Python Program

Sorry about that big detour, back to the main course :poultry_leg:

## Rendering the Image

I heard the [PIL](https://pypi.org/project/PIL/) library was easy to use, so that's what I used. I think it was also why I chose Python in the first place :thinking:
I hadn't realised at the time I originally wrote this program, but `PIL` is no longer being developed for... In fact, it's not even hosted on `PIP` anymore :hushed:

Thus, I have changed the dependency to `Pillow`... Thankfully, no code change was needed to migrate between the two libraries :pray: _Insert joke about smothering PIL to death with a Pillow here_

Each call is plotted on the image as a rectangle, the colour represents the type of call and the side outlines represents who the caller is if specified in the configuration file. The columns are days and the rows are hours. Included in the image is a legend for decoding colours to call types and the total time spent on the phone.

Invalid elements are skipped, i.e. the phone number is missing, perhaps due to an unknown number or one of those rotten telemarketers I have beef with! :cow: :boom: ... unless it's [Adam, Blake, or Anders](https://www.imdb.com/title/tt1610527/)!

It's hard to visually track a call that goes past midnight. It would be useful to be able to customise the starting hour, especially since I'm not seeing any calls between `6am` and `9am`. I might make an update to improve this at a later date.

## Executing the Program

I wanted to create a configuration file so pretty much anything could be customised. So, I made `yet another markup language` file where the colours, sizing, and filtering options are provided. This could have been a Python file and that would have been much simpler, but I haven't used `YAML` much so wanted to try it out here :smile:

The command line arguments are thus

1. `cfgfile` The path to the `.yml` configuration file
1. `infile` The path to the `.xml` or `.aiob`, or `.bin` call history file
1. `outfile` The path to the `.png` output image file

Example execution

```shell
python call_log.py config.yaml history.xml calls.png
```

View the full source code [here](https://github.com/mic-max/calls) on my GitHub.

## Final Product

![Call Visualisation](/assets/img/calls.png)
_Originally completed one night for the girl I was evidently talking to **a lott** at the time._
