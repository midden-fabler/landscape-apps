/-  u=ui
/+  gj=groups-json, cj=chat-json
|_  =init:u
++  grad  %noun
++  grow
  |%
  ++  noun  init
  ++  json
    =,  enjs:format
    %-  pairs
    :~  groups/(groups-ui:enjs:gj groups.init)
        gangs/(gangs:enjs:gj gangs.init)
        briefs/(briefs:enjs:cj briefs.init)
        chats/(chats:enjs:cj chats.init)
        clubs/(clubs:enjs:cj clubs.init)
        dms/a/(turn ~(tap in dms.init) ship:enjs:gj)
        invited/a/(turn ~(tap in invited.init) ship:enjs:gj)
        pins/a/(turn pins.init (cork whom:enjs:cj (lead %s)))
    ==
  --
++  grab
  |%
  ++  noun  init:u
  --
--
