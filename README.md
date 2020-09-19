# Stream Together

[![Build](https://github.com/streamtogether/stream-together-web-extension/workflows/Build/badge.svg)](https://github.com/streamtogether/stream-together-web-extension/actions?query=workflow%3ABuild)
[![Discord](https://img.shields.io/discord/702897660448866365?logo=discord)](https://discord.gg/uBrhkxB)
[![Chrome Web Store](https://img.shields.io/badge/chrome-download-blue?logo=google-chrome)](https://chrome.google.com/webstore/detail/mifelkkomponlfmpiomaohdcjjjnalja)
[![Firefox Add-On Store](https://img.shields.io/badge/firefox-download-orange?logo=firefox)](https://addons.mozilla.org/en-US/firefox/addon/stream-together/)

Watch any video together with friends.

Play a video on any streaming site, and playback & play/pause will
stay synchronized across all your friends. Just make sure everyone
has the extension.

1. Tell everyone to install the Stream Together extension
2. Launch any video on any streaming service
3. Click the Stream Together button in your browser toolbar, and select
   "Create a watch party"
4. Share the link with your group
5. Have each friend click the Stream Together button, and click
   "Join a watch party"
6. Paste the link into the Join box to connect to the session

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
https://github.com/streamtogether/stream-together-web-extension

## Development

Your contributions would be stellar! Here's how you can run the
project locally.

1. Clone this repository
1. Run `npm install`
1. Run `npm start`
1. For Firefox, follow these steps:
    1. Navigate to `about:debugging` in the URL bar
    1. Select "This Firefox" from the sidebar
    1. Select "Load Temporary Add-On..." and choose the
       `dist/manifest.json` file
1. For Google Chrome, follow these steps:
    1. Go to Google Chrome > ... > More Tools > Extensions
    1. Remove any Stream Together extension previously installed
    1. Select "Load Unpacked"
    1. Select the `dist/` folder of the cloned repository

As you make changes, click the `Update` button in the Extensions tab
to try out those changes.

### Distribution

Check out the Github Actions tab (you'll need to be signed in to a GitHub
account) to see builds, and download a ZIP of the latest code.

Uploading builds to the Chrome Web Store and Firefox Add-on Developer Hub
is done by [@hnryjms][hnryjms], who has access to the developer dashboard.

## Licence

Copyright (C) 2019-2020 [@mrsheepsheep][mrsheepsheep], [@hnryjms][hnryjms],
[@overthemike][overthemike], [@SudharsanSukumar][sudharsansukumar]

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
[overthemike]: https://github.com/overthemike
[sudharsansukumar]: https://github.com/SudharsanSukumar
