
## HOW TO RUN PROJECTS & TESTS

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Infrastructure**:
   Ensure you have PostgreSQL and Redis running locally on your machine.
   Update the `.env` file with your local credentials if they differ from the defaults.

4. **Run Application**:
   ```bash
   npm run start:dev
   ```

5. **TESTING**
   I haven't implemented the test cases for this project and also not the optional features (Docker, Throttling ..).



## AI TOOL USED

During development I used Antigravity for generating the boiler plates for this project

## REASONING ABOUT MERGED ALGORITHM

Now as per my understanding of this project through the document, I came to understanding that there would be multiple users and lets say a user can create events and invite some other users in the  events. Now lets say a user creates an event X having some start and endtime it directly gets inserted into the table but now lets say the same user creates another event having some other invitees then this could be a conflicting event on the basis of start and endtime intervals of both the events.


I have done the implementation in a way that when a merge happens between multiple conflicting events the old data i.e. rows in Events table gets deleted and their invitees gets deleted as well after proper insertion of their history in AuditLogs table  and instead the new mergedEvent row is inserted in the Events Table and Union of both event Invitees after removing the duplicates is inserted into the Event_Invitee_users table that is a junction table because of the one to many relation of user and event table.

Now because of this approach 
## POST /events/merge-all/:userId
## GET /events/conflicts/:userId

These two api's weren't created because at any moment we wouldn't have conflicting events in the database intead all the conflicting events would have already been merged and the old rows would get deleted only the merged data would have remain in the tables.


Now merging algorithm is being utilized here in two ways:

1. when a new event is created by a user that already has created an event and the newly created event could cause conflict in this case mergeEvent gets called 

2. when batch insertion is done and alot of events are created then mergeEvent is being called for particular conflicting groups, these conflicting groups has conflicting events stored in it for a particular user.


## AI INTEGRATION

I have mocked up AI summary generation in the AI service, and the mockup AI generation is being utilizied in two ways.

1. Batch Insertion: When batch insertion is done it first inserts all the MergedEvents in the table and then it sends the call for Mockup AI summary generation and then it updates the description for each MergedEvent. In this way the Batch insertion doesn't rely on AI summary Generation

2. On Single Event Creation: When a single event is created through /events/create api and a merge happens than after the insertion of Merge Event mock AI summary generation Api gets called.