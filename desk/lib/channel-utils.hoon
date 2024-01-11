/-  c=channels, g=groups
::  convert a post to a preview for a "said" response
::
|%
::  +uv-* functions convert posts, replies, and reacts into their "unversioned"
::  forms, suitable for responses to our subscribers
::
++  uv-channels
  |=  =v-channels:c
  ^-  channels:c
  %-  ~(run by v-channels)
  |=  channel=v-channel:c
  ^-  channel:c
  %*  .  *channel:c
    posts  *posts:c
    perm   +.perm.channel
    view   +.view.channel
    sort   +.sort.channel
    order  +.order.channel
  ==
++  uv-posts
  |=  =v-posts:c
  ^-  posts:c
  %+  gas:on-posts:c  *posts:c
  %+  turn  (tap:on-v-posts:c v-posts)
  |=  [=id-post:c v-post=(unit v-post:c)]
  ^-  [id-post:c (unit post:c)]
  [id-post ?~(v-post ~ `(uv-post u.v-post))]
::
++  uv-post
  |=  =v-post:c
  ^-  post:c
  :_  +>.v-post
  :*  id.v-post
      (uv-reacts reacts.v-post)
      (uv-replies id.v-post replies.v-post)
      (get-reply-meta v-post)
  ==
::
++  uv-posts-without-replies
  |=  =v-posts:c
  ^-  posts:c
  %+  gas:on-posts:c  *posts:c
  %+  turn  (tap:on-v-posts:c v-posts)
  |=  [=id-post:c v-post=(unit v-post:c)]
  ^-  [id-post:c (unit post:c)]
  [id-post ?~(v-post ~ `(uv-post-without-replies u.v-post))]
::
++  uv-post-without-replies
  |=  post=v-post:c
  ^-  post:c
  :_  +>.post
  :*  id.post
      (uv-reacts reacts.post)
      *replies:c
      (get-reply-meta post)
  ==
::
++  uv-replies
  |=  [parent-id=id-post:c =v-replies:c]
  ^-  replies:c
  %+  gas:on-replies:c  *replies:c
  %+  murn  (tap:on-v-replies:c v-replies)
  |=  [=time v-reply=(unit v-reply:c)]
  ^-  (unit [id-reply:c reply:c])
  ?~  v-reply  ~
  %-  some
  [time (uv-reply parent-id u.v-reply)]
::
++  uv-reply
  |=  [parent-id=id-reply:c =v-reply:c]
  ^-  reply:c
  :_  +>.v-reply
  [id.v-reply parent-id (uv-reacts reacts.v-reply)]
::
++  uv-reacts
  |=  =v-reacts:c
  ^-  reacts:c
  %-  ~(gas by *reacts:c)
  %+  murn  ~(tap by v-reacts)
  |=  [=ship (rev:c react=(unit react:c))]
  ?~  react  ~
  (some ship u.react)
::
++  said
  |=  [=nest:c =plan:c posts=v-posts:c]
  ^-  cage
  =/  post=(unit (unit v-post:c))  (get:on-v-posts:c posts p.plan)
  ?~  q.plan
    =/  =post:c
      ?~  post
        ::TODO  give "outline" that formally declares deletion
        :-  *seal:c
        ?-  kind.nest
          %diary  [*memo:c %diary 'Unknown post' '']
          %heap   [*memo:c %heap ~ 'Unknown link']
          %chat   [[[%inline 'Unknown message' ~]~ ~nul *@da] %chat ~]
        ==
      ?~  u.post
        :-  *seal:c
        ?-  kind.nest
            %diary  [*memo:c %diary 'This post was deleted' '']
            %heap   [*memo:c %heap ~ 'This link was deleted']
            %chat
          [[[%inline 'This message was deleted' ~]~ ~nul *@da] %chat ~]
        ==
      (uv-post-without-replies u.u.post)
    [%channel-said !>(`said:c`[nest %post post])]
  ::
  =/  =reply:c
    ?~  post
      [*reply-seal:c ~[%inline 'Comment on unknown post']~ ~nul *@da]
    ?~  u.post
      [*reply-seal:c ~[%inline 'Comment on deleted post']~ ~nul *@da]
    =/  reply=(unit (unit v-reply:c))  (get:on-v-replies:c replies.u.u.post u.q.plan)
    ?~  reply
      [*reply-seal:c ~[%inline 'Unknown comment']~ ~nul *@da]
    ?~  u.reply
      [*reply-seal:c ~[%inline 'This comment was deleted']~ ~nul *@da]
    (uv-reply p.plan u.u.reply)
  [%channel-said !>(`said:c`[nest %reply p.plan reply])]
::
++  was-mentioned
  |=  [=story:c who=ship]
  ^-  ?
  %+  lien  story
  |=  =verse:c
  ?:  ?=(%block -.verse)  |
  %+  lien  p.verse
  (cury test [%ship who])
::
++  flatten
  |=  content=(list verse:c)
  ^-  cord
  %+  rap   3
  %+  turn  content
  |=  v=verse:c
  ^-  cord
  ?-  -.v
      %block  ''
      %inline
    %+  rap  3
    %+  turn  p.v
    |=  c=inline:c
    ^-  cord
    ?@  c  c
    ?-  -.c
        %break                 ''
        %tag                   p.c
        %link                  q.c
        %block                 q.c
        ?(%code %inline-code)  ''
        %ship                  (scot %p p.c)
        %task                  (flatten [%inline q.c]~)
        ?(%italics %bold %strike %blockquote)
      (flatten [%inline p.c]~)
    ==
  ==
::
++  trace
  |=  post=v-post:c
  ^-  outline:c
  =;  replyers=(set ship)
    [~(wyt by replies.post) replyers +>.post]
  =-  (~(gas in *(set ship)) (scag 3 ~(tap in -)))
  %-  ~(gas in *(set ship))
  %+  murn  (tap:on-v-replies:c replies.post)
  |=  [@ reply=(unit v-reply:c)]
  ?~  reply  ~
  (some author.u.reply)
::
++  get-reply-meta
  |=  post=v-post:c
  ^-  reply-meta:c
  :*  (get-non-null-reply-count replies.post)
      (get-last-repliers post)
      (biff (ram:on-v-replies:c replies.post) |=([=time *] `time))
  ==
::
++  get-non-null-reply-count
  |=  replies=v-replies:c
  ^-  @ud
  =/  entries=(list [time (unit v-reply:c)])  (bap:on-v-replies:c replies)
  =/  count  0
  |-  ^-  @ud
  ?:  =(~ entries)
    count
  =/  [* reply=(unit v-reply:c)]  -.entries
  ?~  reply  $(entries +.entries)
  $(entries +.entries, count +(count))
::
++  get-last-repliers
  |=  post=v-post:c  ::TODO  could just take =v-replies
  ^-  (set ship)
  =|  replyers=(set ship)
  =/  entries=(list [time (unit v-reply:c)])  (bap:on-v-replies:c replies.post)
  |-
  ?:  |(=(~ entries) =(3 ~(wyt in replyers)))
    replyers
  =/  [* reply=(unit v-reply:c)]  -.entries
  ?~  reply  $(entries +.entries)
  ?:  (~(has in replyers) author.u.reply)
    $(entries +.entries)
  =.  replyers  (~(put in replyers) author.u.reply)
  $(entries +.entries)
++  perms
  |_  [our=@p now=@da tick=@ud =nest:c group=flag:g]
  ++  am-host  =(our ship.nest)
  ++  groups-scry
    ^-  path
    :-  (scot %p our)
    /groups/(en-cose da+now ud+tick)/groups/(scot %p p.group)/[q.group]
  ::
  ++  is-admin
    |=  her=ship
    ?:  =(ship.nest her)  &
    .^  admin=?
    ;:  weld
        /gx
        groups-scry
        /channel/[kind.nest]/(scot %p ship.nest)/[name.nest]
        /fleet/(scot %p her)/is-bloc/loob
    ==  ==
  ::
  ++  can-write
    |=  [her=ship writers=(set sect:g)]
    ?:  =(ship.nest her)  &
    =/  =path
      %+  welp  groups-scry
      :+  %channel  kind.nest
      /(scot %p ship.nest)/[name.nest]/can-write/(scot %p her)/noun
    =+  .^(write=(unit [bloc=? sects=(set sect:g)]) %gx path)
    ?~  write  |
    =/  perms  (need write)
    ?:  |(bloc.perms =(~ writers))  &
    !=(~ (~(int in writers) sects.perms))
  ::
  ++  can-read
    |=  her=ship
    ?:  =(our her)  &
    =/  =path
      %+  welp  groups-scry
      :+  %channel  kind.nest
      /(scot %p ship.nest)/[name.nest]/can-read/(scot %p her)/loob
    .^(? %gx path)
  --
--
