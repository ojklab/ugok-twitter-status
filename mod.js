// import { config } from 'https://deno.land/x/dotenv/mod.ts';

async function handleRequest(req) {
  const userNames = [
    'UGOK_5563',
    'usagi_UGOK',
    'AyA3156_ugok',
    'kumi_UGOK',
    'ms_UGOK',
    'yuria_ugok',
    'misk_ugok',
    'mami_ugok',
    '0024_ugok',
    'haru_ugok',
    'natsu_ugok',
    'sakumwu',
    'HMDKN_5A',
    'asuka_ugok',
  ];

  const baseUrl = 'https://api.twitter.com/2/users/';
  const options = '/tweets?max_results=100&user.fields=name&tweet.fields=created_at,public_metrics&start_time=';
  // const bearerToken = Deno.env.get('TwitterBearer') ?? config().TwitterBearer;
  const bearerToken = Deno.env.get('TwitterBearer');
  const startTime = '2021-04-17T00:00:00Z';

  const data = {};

  for (const username of userNames) {
    const userLookupUrl = baseUrl + 'by/username/' + username;
    //console.log(userLookupUrl);
    const userData = await fetch(userLookupUrl, {
      headers: {
        Authorization: 'Bearer ' + bearerToken,
      },
    });

    const userJson = await userData.json();
    // console.log(userJson);

    // 失敗
    if (userJson.data == null) {
      const res = JSON.stringify({ status: 'error', user: username, message: userJson });
      return new Response(res, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    const uid = userJson.data.id;
    const name = userJson.data.name;
    const timeLineUrl = baseUrl + uid + options + startTime;
    const timeline = await fetch(timeLineUrl, {
      headers: {
        Authorization: 'Bearer ' + bearerToken,
      },
    });

    const tlJson = await timeline.json();

    // 失敗
    if (tlJson.data == null && tlJson.meta.result_count !== 0) {
      const res = JSON.stringify({ status: 'error', message: tlJson });
      return new Response(res, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    data[name] = tlJson.data ?? {};
  }

  // 成功
  const res = JSON.stringify({ status: 'success', data });
  return new Response(res, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

// fetchで待機
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
