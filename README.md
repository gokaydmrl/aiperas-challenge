aiperas challenge
RESUMABLE STREAM CHAT WITH SSE.

built with:
NEXT.JS - TAILWIND

edge cases handled, such as:
 - duplicate chunk
 - server failure
 - expired sessions
 - race conditions

 stream countinues after:
 - page reload
 - closing the browser

in order to run:
npm i 
npm run dev

notes:
server changed a little bit to handle request body (lastEventId) for a better resume