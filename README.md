# Stream Party

Watch any video together with friends.

Play a video on any streaming site, and playback & play/pause will
stay synchronized across all your friends. Just make sure everyone
has the extension.

1. Tell everyone to install the Stream Party extension
2. Launch any video on any streaming service
3. Click the Stream Party button in your browser toolbar
4. Share the link with your group

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
[https://github.com/mrsheepsheep/watchparty][github]

[github]: https://github.com/mrsheepsheep/watchparty

## Development

Your contributions would be stellar! Here's how you can run the
project locally.

1. Clone this repository
1. Run `npm install`
1. Run `npm start`
1. Go to Google Chrome > ... > More Tools > Extensions
1. Remove any Stream Party extension previously installed
1. Select "Load Unpacked"
1. Select the `dist/` folder of the cloned repository

As you make changes, click the `Update` button in the Extensions tab
to try out those changes.

### Distribution

The steps below will bundle the application for the Chrome Web Store.
This is currently done by [@hnryjms](https://github.com/hnryjms),
who has access to the CWA developer dashboard.

```sh
rm -rf dist
npm run build
pushd dist
zip -r ../chrome-extension-stream-party.zip .
popd
```

## Licence

Copyright (C) 2019 Alexandre Souleau

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
