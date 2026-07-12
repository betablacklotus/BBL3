import type { Post } from './types';

// Sample posts. In a real deployment, these would live as individual .md files
// in a /content/posts directory and be loaded at build time. For this app they
// are defined here so the blog works out of the box and is easy to edit.
// To add a post: copy the shape below, give it a unique slug, and set the date.

export const SAMPLE_POSTS: Post[] = [
  {
    slug: 'bandcamp-post',
    title: 'Bandcamp Post',
    date: '2026-07-06',
    excerpt:
      'Bumble Bee is a slow-moving, hazy track from Beta Black Lotus — the kind of thing you put on when you want the room to feel like late afternoon in July.',
    tags: ['music', 'bandcamp'],
    content: `# Bandcamp Post

Been listening to this one on repeat for the past few days. *Bumble Bee* by **Beta Black Lotus** — it sits somewhere between drone and folk, unhurried and warm. Worth a listen if you have a few minutes and somewhere quiet to be.

:::bandcamp-track 2523726560

If Bandcamp is your thing, you can follow them there and pay what you want for the download. Good music deserves support.`,
  },

  {
    slug: 'welcome-to-the-terminal',
    title: 'Welcome to Beta Black Lotus',
    date: '2026-06-28',
    excerpt:
      'A short note on why I started this weblog, what I plan to write about, and a few ground rules for the kind of place I want this to be.',
    pinned: true,
    tags: ['meta', 'announcement'],
    featuredImage: 'https://images.pexels.com/photos/270557/pexels-photo-270557.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'Welcome to Beta Black Lotus — A Personal Weblog',
    socialDescription: 'Why I started this weblog and what to expect.',
    socialImage: 'https://images.pexels.com/photos/270557/pexels-photo-270557.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Welcome to Beta Black Lotus

I have been thinking about starting a weblog for a long time. Not a newsletter, not a "content site," not a social profile — a *weblog*. A place where I write things down, in order, and anyone who wants to can read them.

This is that place.

## What this is

I plan to write about:

- Small software projects and the lessons learned from them
- Books, mostly old ones
- Field recordings and the places I made them
- The occasional opinion about tools, held loosely

## What this is not

This is not a place for hot takes, engagement bait, or "thought leadership." I am not building an audience. I am keeping a notebook in public, and you are welcome to read over my shoulder.

## A note on the design

You will notice the site looks like it was made in 1996. That is deliberate. I wanted something quiet, fast, and readable on any device — including the old phone in my pocket. The font is **IBM Plex Mono**. The background is off-white. There are no popups, no cookie banners, no tracking, and no infinite scroll that breaks the back button.

Well — there *is* infinite scroll. But there is also a Load More button, because I do not trust infinite scroll either.

---

Thanks for stopping by. If you want to reach me, there is a [contact page](/contact). If you want to subscribe, there is an [RSS feed](/feed.xml).`,
  },

  {
    slug: 'on-keeping-a-notebook-in-public',
    title: 'On Keeping a Notebook in Public',
    date: '2026-06-15',
    excerpt:
      'Joan Didion wrote that we keep a notebook to remember what it was like to be ourselves. I think keeping one in public is a slightly different exercise.',
    tags: ['writing', 'essays'],
    featuredImage: 'https://images.pexels.com/photos/633432/pexels-photo-633432.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'On Keeping a Notebook in Public',
    socialDescription: 'A short essay on writing in public, after Didion.',
    socialImage: 'https://images.pexels.com/photos/633432/pexels-photo-633432.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# On Keeping a Notebook in Public

Joan Didion, in her essay *On Keeping a Notebook*, wrote that the point of keeping one is not to record the facts but to remember "how it felt to be me." That is a private act. A weblog is something else.

## The difference

A notebook is for you. A weblog is for you *and* someone else — a reader you cannot see and cannot predict. That changes what you write, and how. You start to explain things you would not bother explaining to yourself. You leave out the things that are only interesting to you. Sometimes that is a loss.

## What I am trying to do

I am trying to write the way I would write a long letter to a friend I had not seen in a year. Not formal, but not careless. Detailed where it matters, brief where it does not. Honest about what I do not know.

> "I think we are well advised to keep on nodding terms with the people we used to be." — Didion

That is the project, I suppose. Keeping on nodding terms with the people I used to be, and letting you read the notes.`,
  },

  {
    slug: 'field-recording-the-creek-in-july',
    title: 'Field Recording: The Creek in July',
    date: '2026-06-03',
    excerpt:
      'A short field recording from the creek behind the old mill, with notes on the equipment used and the sound of low water over smooth stones.',
    tags: ['audio', 'field-recording', 'bunny'],
    featuredImage: 'https://images.pexels.com/photos/1005014/pexels-photo-1005014.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'Field Recording: The Creek in July',
    socialDescription: 'A Bunny Stream audio recording of a creek in summer.',
    socialImage: 'https://images.pexels.com/photos/1005014/pexels-photo-1005014.jpeg?auto=compress&cs=tinysrgb&w=1200',
    bunnyAudioId: 'example-audio-001',
    bunnyLibraryId: 'example-library',
    content: `# Field Recording: The Creek in July

I walked out to the creek behind the old mill at about six in the morning. The water was low — barely moving in places — but over the smooth stones near the bridge there was still a steady, glassy sound I wanted to capture.

## The recording

Below is an audio player powered by **Bunny Stream**. The file is token-protected and domain-restricted, so it should play here but not anywhere else.

:::bunny-audio example-library example-audio-001

## Notes on the setup

- Recorder: a small handheld field recorder, 48kHz / 24-bit
- Mics: a pair of cardioids in ORTF, about 17cm apart
- Windscreen: foam plus a fuzzy, because the breeze picked up around 6:40
- No processing, no compression, no EQ — just the raw stereo file

## What I hear

There are three layers: the water over the stones, a distant crow, and — if you listen — the faint hum of the mill's electrical service about forty meters away. I like that last one. It is the sound of the place being inhabited, even at six in the morning.`,
  },

  {
    slug: 'a-walk-through-the-old-quarter',
    title: 'A Walk Through the Old Quarter',
    date: '2026-05-20',
    excerpt:
      'A photo essay from a morning walk through the old quarter, with a short video clip of the square at the top of the hill.',
    tags: ['photo', 'video', 'bunny', 'travel'],
    featuredImage: 'https://images.pexels.com/photos/2078126/pexels-photo-2078126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'A Walk Through the Old Quarter — Photo Essay',
    socialDescription: 'A morning walk through the old quarter, with photos and video.',
    socialImage: 'https://images.pexels.com/photos/2078126/pexels-photo-2078126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    bunnyVideoId: 'example-video-001',
    bunnyLibraryId: 'example-library',
    content: `# A Walk Through the Old Quarter

I got up early and walked through the old quarter before the shops opened. The light was flat and grey, which is the best light for that part of the city — it makes the stone look like stone, not like a postcard.

## A few photographs

![Narrow street in the old quarter](https://images.pexels.com/photos/2078126/pexels-photo-2078126.jpeg?auto=compress&cs=tinysrgb&w=800)
![Doorway with iron hardware](https://images.pexels.com/photos/209271/pexels-photo-209271.jpeg?auto=compress&cs=tinysrgb&w=800)
![Café opening up at dawn](https://images.pexels.com/photos/2255238/pexels-photo-2255238.jpeg?auto=compress&cs=tinysrgb&w=800)
![Steps up the hill](https://images.pexels.com/photos/2425567/pexels-photo-2425567.jpeg?auto=compress&cs=tinysrgb&w=800)

## The square at the top of the hill

There is a small square at the top of the hill with a fountain in the middle. I took a short video clip of it. The clip is hosted on **Bunny Stream** with token authentication, so it plays here but should not be downloadable.

:::bunny-video example-library example-video-001

## What I learned

I have walked through that quarter a hundred times and never noticed the iron hardware on the doors. It is worth looking up.

## More from the walk

![Window boxes on a second floor](https://images.pexels.com/photos/1450363/pexels-photo-1450363.jpeg?auto=compress&cs=tinysrgb&w=800)
![A cat on a warm sill](https://images.pexels.com/photos/6134085/pexels-photo-6134085.jpeg?auto=compress&cs=tinysrgb&w=800)
![Cobbled lane in shadow](https://images.pexels.com/photos/2425567/pexels-photo-2425567.jpeg?auto=compress&cs=tinysrgb&w=800)
![Old church facade](https://images.pexels.com/photos/1462330/pexels-photo-1462330.jpeg?auto=compress&cs=tinysrgb&w=800)`,
  },

  {
    slug: 'seventeen-frames-from-the-coast',
    title: 'Seventeen Frames from the Coast',
    date: '2026-07-04',
    excerpt:
      'A day shooting on the coast — sea light, fishing boats, peeling paint, and the particular grey of a sky that cannot make up its mind.',
    tags: ['photo', 'travel', 'coast'],
    featuredImage: 'https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'Seventeen Frames from the Coast',
    socialDescription: 'A photo essay from a day shooting on the coast.',
    socialImage: 'https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Seventeen Frames from the Coast

I took a day and drove to the coast with no particular plan. Low tide was at half past seven in the morning, which meant good light on the wet sand and nobody else around. I shot until the fog burned off, then walked back to the car and drove home. These are the frames I kept.

---

![Wet sand at low tide, early morning](https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=900)
![Fishing boats moored in harbour](https://images.pexels.com/photos/163236/pexels-photo-163236.jpeg?auto=compress&cs=tinysrgb&w=900)
![Coiled rope on a wooden dock](https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=900)
![Peeling blue paint on a boat hull](https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=900)
![Fog sitting low over the water](https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=900)
![Seabirds on a groyne at low water](https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=900)
![Weathered wooden bollard](https://images.pexels.com/photos/2249959/pexels-photo-2249959.jpeg?auto=compress&cs=tinysrgb&w=900)
![Breakwater extending into a grey sea](https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop)
![Rock pools exposed at low tide](https://images.pexels.com/photos/2480078/pexels-photo-2480078.jpeg?auto=compress&cs=tinysrgb&w=900)
![Kelp draped over dark rocks](https://images.pexels.com/photos/1450363/pexels-photo-1450363.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop)
![Old stone sea wall, close texture](https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=900)
![Iron ladder descending to the water](https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=900)
![Horizon line with a distant vessel](https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=900)
![Pebble beach, long exposure blur](https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg?auto=compress&cs=tinysrgb&w=900)
![Wooden beach hut, faded yellow](https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=900)
![Footprints in wet sand leading away](https://images.pexels.com/photos/1005014/pexels-photo-1005014.jpeg?auto=compress&cs=tinysrgb&w=900)
![The sea, simply](https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=900&h=500&fit=crop)

---

All seventeen frames were shot on the same morning with the same lens. No filters, no edits beyond a slight exposure correction on a few. The coast does most of the work.`,
  },

  {
    slug: 'seventeen-frames-gallery',
    title: 'Seventeen Frames Gallery',
    date: '2026-07-05',
    excerpt:
      'All seventeen frames from the coast in one place — wet sand, fog, fishing boats, and the particular grey of a sky that cannot make up its mind.',
    tags: ['photo', 'travel', 'coast'],
    featuredImage: 'https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'Seventeen Frames Gallery',
    socialDescription: 'All seventeen frames from a morning on the coast.',
    socialImage: 'https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# Seventeen Frames Gallery

All seventeen frames from a morning on the coast. Low tide, early light, nobody else around.

---

![Wet sand at low tide, early morning](https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=900)
![Fishing boats moored in harbour](https://images.pexels.com/photos/163236/pexels-photo-163236.jpeg?auto=compress&cs=tinysrgb&w=900)
![Coiled rope on a wooden dock](https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=900)
![Peeling blue paint on a boat hull](https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=900)
![Fog sitting low over the water](https://images.pexels.com/photos/1547813/pexels-photo-1547813.jpeg?auto=compress&cs=tinysrgb&w=900)
![Seabirds on a groyne at low water](https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=900)
![Weathered wooden bollard](https://images.pexels.com/photos/2249959/pexels-photo-2249959.jpeg?auto=compress&cs=tinysrgb&w=900)
![Breakwater extending into a grey sea](https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop)
![Rock pools exposed at low tide](https://images.pexels.com/photos/2480078/pexels-photo-2480078.jpeg?auto=compress&cs=tinysrgb&w=900)
![Kelp draped over dark rocks](https://images.pexels.com/photos/1450363/pexels-photo-1450363.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop)
![Old stone sea wall, close texture](https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=900)
![Iron ladder descending to the water](https://images.pexels.com/photos/1670977/pexels-photo-1670977.jpeg?auto=compress&cs=tinysrgb&w=900)
![Horizon line with a distant vessel](https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=900)
![Pebble beach, long exposure blur](https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg?auto=compress&cs=tinysrgb&w=900)
![Wooden beach hut, faded yellow](https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=900)
![Footprints in wet sand leading away](https://images.pexels.com/photos/1005014/pexels-photo-1005014.jpeg?auto=compress&cs=tinysrgb&w=900)
![The sea, simply](https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=900&h=500&fit=crop)`,
  },

  {
    slug: 'on-using-old-tools',
    title: 'On Using Old Tools',
    date: '2026-05-02',
    excerpt:
      'A short defense of using software that is older than you are. Not out of nostalgia, but because the constraints are often the point.',
    tags: ['software', 'essays'],
    featuredImage: 'https://images.pexels.com/photos/261880/pexels-photo-261880.jpeg?auto=compress&cs=tinysrgb&w=1200',
    socialTitle: 'On Using Old Tools',
    socialDescription: 'A defense of old software, and why the constraints are the point.',
    socialImage: 'https://images.pexels.com/photos/261880/pexels-photo-261880.jpeg?auto=compress&cs=tinysrgb&w=1200',
    content: `# On Using Old Tools

I write most of my prose in a plain text editor. I keep my notes in a single directory of markdown files. I use a mail client that was first released in 2003. People sometimes ask me why.

## The constraints are the feature

Old tools are *opinionated*. They were built before the idea that a program should try to do everything for everyone. They do a small number of things, they do them in a particular way, and they do not apologize for it.

That sounds like a limitation. It is actually a relief. When the tool will not let you do a thing, you stop trying to do that thing, and you get on with the work.

## Plain text

Plain text is the clearest example. A plain text file:

1. Will open on any machine, in any editor, now and in thirty years
2. Can be searched, diffed, and version-controlled without any special software
3. Has no formatting to fight with, so you write instead of designing

## The objection

The objection is always the same: "but you could do that in the new tool too." Yes. You can do almost anything in the new tool. That is exactly the problem. The new tool will let you spend an afternoon choosing a font for your notes. The old tool does not have fonts. You write instead.

---

Use whatever lets you do the work. But do not assume newer is better. Sometimes the tool that gets out of your way is the one that was never in your way to begin with.`,
  },
];
