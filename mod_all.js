const userNames = [
  // 'asuka_ugok',
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
];

async function handleRequest(req) {
  // クエリパラメータの取得
  const url = new URL(req.url);
  if (url.searchParams.get('with') !== 'on') {
    userNames.shift();
  }

  // Twitter API v2
  const baseUrl = 'https://api.twitter.com/2/users/';
  const options = '/tweets?max_results=100&tweet.fields=created_at,public_metrics&start_time=';
  const bearerToken = Deno.env.get('TwitterBearer');

  // 区切り開始からのデータ
  const date = new Date(2021, 9, 1);
  // date.setDate(date.getDate() - 21);
  const startTime = date.toISOString();

  // 収集したデータを入れるところ
  const data = [];

  // 全ユーザに対してデータ取得（DenoDeployの制限によっては要変更？）
  for (const username of userNames) {
    // ユーザID等の取得
    const userLookupUrl = `${baseUrl}by/username/${username}?user.fields=profile_image_url`;
    // console.log(userLookupUrl);
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

    // タイムラインデータの取得
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

    // データの記録
    const record = {};
    record.name = name;
    record.screenName = username;
    const iconUrl = userJson.data.profile_image_url;
    // _normalを取るとオリジナル
    record.iconUrl = iconUrl.replace('_normal', '_bigger');
    record.tweets = tlJson.data ?? [];
    data.push(record);
  }

  // 成功
  const res = JSON.stringify({ status: 'success', data });
  return new Response(res, {
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:5000',
      // 'Access-Control-Allow-Origin': 'https://ugok-girls.github.io',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

// fetchで待機
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
