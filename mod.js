async function handleRequest(req) {
  // クエリパラメータの取得
  const url = new URL(req.url);
  const username = url.searchParams.get('member');

  // Twitter API v2
  const bearerToken = Deno.env.get('TwitterBearer');
  const baseUrl = 'https://api.twitter.com/2/users/';

  // ユーザID等の取得
  const options =
    '/tweets?max_results=100&tweet.fields=created_at,author_id,in_reply_to_user_id,public_metrics&start_time=';
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
        'Access-Control-Allow-Origin': 'https://ugok-girls.github.io',
        'content-type': 'application/json; charset=utf-8',
      },
    });
  }

  // 実験区切りの日付
  const date = new Date(2021, 9, 3, 15, 0, 0);
  // const date = new Date();
  // date.setDate(date.getDate() - 14);
  const startTime = date.toISOString();

  // タイムラインデータの取得
  const uid = userJson.data.id;
  // const timeLineUrl = baseUrl + uid + options + startTime;
  const endDate = new Date(2021, 12, 25, 15, 0, 0).toISOString;
  const timeLineUrl = baseUrl + uid + options + startTime + '&end_time=' + endDate;
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
        'Access-Control-Allow-Origin': 'https://ugok-girls.github.io',
        'content-type': 'application/json; charset=utf-8',
      },
    });
  }

  // データの記録
  const record = {};
  record.screenName = userJson.data.name;
  record.userName = username;
  const iconUrl = userJson.data.profile_image_url;
  // _normalを取るとオリジナル
  record.iconUrl = iconUrl.replace('_normal', '_bigger');
  record.tweets = tlJson.data ?? [];

  // 成功
  const res = JSON.stringify({ status: 'success', record });
  return new Response(res, {
    headers: {
      // 'Access-Control-Allow-Origin': 'http://localhost:5000',
      'Access-Control-Allow-Origin': 'https://ugok-girls.github.io',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

// fetchで待機
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
