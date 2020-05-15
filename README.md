# Stream Together

[![Build](https://github.com/streamtogether/chrome-extension-stream-together/workflows/Build/badge.svg)](https://github.com/streamtogether/chrome-extension-stream-together/actions?query=workflow%3ABuild)
[![Discord](https://img.shields.io/discord/702897660448866365?logo=discord)](https://discord.gg/uBrhkxB)
[![Chrome Web Store](https://img.shields.io/badge/chrome-download-blue?logo=google-chrome)](https://chrome.google.com/webstore/detail/mifelkkomponlfmpiomaohdcjjjnalja)

Watch any video together with friends.

**Note: until our UI is finished, the Chrome Web Store may be outdated**

Play a video on any streaming site, and playback & play/pause will
stay synchronized across all your friends. Just make sure everyone
has the extension.

1. Tell everyone to install the Stream Together extension
2. Launch any video on any streaming service
3. Click the Stream Together button in your browser toolbar, and leave the Host ID blank
4. Share the link with your group
5. Have each friend click the Stream Together button—it should automatically enter the ID.

You should get a notification as your friends join the party.

Supported websites:

-   Netflix
-   Amazon Prime Video
-   Disney+
-   YouTube
-   Les Mills On Demand
-   more we don't know about! Reach out to add to our list, or to let
    us know of a site that isn't working the way it should.

This project is open source. See our roadmap, fix bugs or help out at:
https://github.com/streamtogether/chrome-extension-stream-together

## Development

Your contributions would be stellar! Here's how you can run the
project locally.

1. Clone this repository
1. Run `npm install`
1. Run `npm start`
1. Go to Google Chrome > ... > More Tools > Extensions
1. Remove any Stream Together extension previously installed
1. Select "Load Unpacked"
1. Select the `dist/` folder of the cloned repository

As you make changes, click the `Update` button in the Extensions tab
to try out those changes.

### Distribution

Check out the Github Actions tab (you'll need to be signed in to a GitHub
account) to see builds, and download a ZIP of the latest code.

Uploading builds to the Chrome Web Store is currently done by [@hnryjms][hnryjms],
who has access to the CWA developer dashboard.

## Licence

Copyright (C) 2019 [@mrsheepsheep][mrsheepsheep], [@hnryjms][hnryjms],
[@SudharsanSukumar][sudharsansukumar]

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>

[mrsheepsheep]: https://github.com/mrsheepsheep
[hnryjms]: https://github.com/hnryjms
[sudharsansukumar]: https://github.com/SudharsanSukumar
