import { describe, it, expect, afterEach, vi } from "vitest";
import crypto from "crypto";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { httpRequest } from "./utils";
import { FeedReader } from "./feedReader.js";

const linkToId = (link) =>
  crypto
    .createHash("sha256")
    .update(link)
    .digest("base64")
    .replace(/[^0-9A-Za-z]/g, "");

vi.mock("./utils.js");

const refMock = {
  get: vi.fn(() => ({ exists: false })),
  set: vi.fn(),
  update: vi.fn(),
};
const collectionMock = {
  doc: vi.fn(() => refMock),
  get: vi.fn(),
};
const db = { collection: vi.fn(() => collectionMock) };

afterEach(() => {
  vi.clearAllMocks();
});

describe("getFeedUrls()", () => {
  it("should return unique feed URLs from templates", async () => {
    // Prepare
    const feedUrls = [
      "http://example.com/feed1",
      "http://example.com/feed2",
      "http://example.com/feed1", // Duplicate
      "http://example.com/feed3",
    ];
    const mockGet = vi.fn();
    mockGet
      .mockReturnValueOnce(feedUrls[0])
      .mockReturnValueOnce(feedUrls[1])
      .mockReturnValueOnce(feedUrls[2]);
    mockGet.mockReturnValueOnce(feedUrls[3]);
    const snapshot = {
      docs: feedUrls.map(() => ({ get: mockGet })),
    };
    collectionMock.get.mockResolvedValueOnce(snapshot);
    const feedReader = new FeedReader(db);

    // Execute
    const urls = await feedReader.getFeedUrls();

    // Verify
    expect(db.collection.mock.calls).toEqual([["templates"]]);
    expect(db.collection().get.mock.calls).toEqual([[]]);
    expect(urls).toEqual([feedUrls[0], feedUrls[1], feedUrls[3]]);
  });
});

describe("readFeed()", () => {
  it("should read RSS feed and add feeds/*", async () => {
    // Prepare
    const url = "http://example.com/rss";
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
>
  <channel>
    <title>コンピュータ・ユニオン</title>
    <atom:link href="https://computer-union.jp/?feed=rss2" rel="self" type="application/rss+xml" />
    <link>https://computer-union.jp</link>
    <description>電算労コンピュータ関連労働組合</description>
    <lastBuildDate>Thu, 15 May 2025 10:23:34 +0000</lastBuildDate>
    <language>ja</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>https://wordpress.org/?v=6.8.1</generator>
    <item>
      <title>&#8217;25/6【リモート】PHP：生産管理システムリニューアル</title>
      <link>https://computer-union.jp/?p=7612</link>
      <dc:creator><![CDATA[ソフトウェアセクション]]></dc:creator>
      <pubDate>Thu, 15 May 2025 10:23:34 +0000</pubDate>
      <category><![CDATA[しごと情報]]></category>
      <guid isPermaLink="false">https://computer-union.jp/?p=7612</guid>
      <description><![CDATA[職種 SE 契約額 〜70万円 期間 &#8217;25年7月〜中長期 業務内容 詳細設計から参画いただきます。 管理番号:3829]]></description>
    </item>
    <item>
      <title>&#8217;25/6【リモート/都内】ERP導入支援コンサルタント</title>
      <link>https://computer-union.jp/?p=7610</link>
      <dc:creator><![CDATA[ソフトウェアセクション]]></dc:creator>
      <pubDate>Thu, 15 May 2025 10:20:43 +0000</pubDate>
      <category><![CDATA[しごと情報]]></category>
      <guid isPermaLink="false">https://computer-union.jp/?p=7610</guid>
      <description><![CDATA[職種 コンサルタント 契約額 〜110万円 期間 &#8217;25年5月〜 業務内容 大手企業向けに導入されるERPパッケージ [&#8230;]]]></description>
    </item>
  </channel>
</rss>`;
    const expectedData = [
      {
        title: "’25/6【リモート】PHP：生産管理システムリニューアル",
        link: "https://computer-union.jp/?p=7612",
        description:
          "職種 SE 契約額 〜70万円 期間 ’25年7月〜中長期 業務内容 詳細設計から参画いただきます。 管理番号:3829",
        pubDate: Timestamp.fromDate(new Date("2025-05-15T10:23:34.000Z")),
        category: "しごと情報",
        feed: url,
        status: "new",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        title: "’25/6【リモート/都内】ERP導入支援コンサルタント",
        link: "https://computer-union.jp/?p=7610",
        description:
          "職種 コンサルタント 契約額 〜110万円 期間 ’25年5月〜 業務内容 大手企業向けに導入されるERPパッケージ […]",
        pubDate: Timestamp.fromDate(new Date("2025-05-15T10:20:43.000Z")),
        category: "しごと情報",
        feed: url,
        status: "new",
        updatedAt: FieldValue.serverTimestamp(),
      },
    ];

    httpRequest.mockResolvedValue({
      data: { text: () => Promise.resolve(xml) },
    });
    refMock.get
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ exists: true });
    const feedReader = new FeedReader(db);

    // Execute
    await feedReader.readFeed(url);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[url]]);
    expect(db.collection.mock.calls).toEqual([["feeds"], ["feeds"]]);
    expect(collectionMock.doc.mock.calls).toEqual([
      [linkToId(expectedData[0].link)],
      [linkToId(expectedData[1].link)],
    ]);
    expect(refMock.get.mock.calls).toEqual([[], []]);
    expect(refMock.set.mock.calls).toEqual([[expectedData[0]]]);
    expect(refMock.update.mock.calls).toEqual([[expectedData[1]]]);
  });

  it("should read Atom feed and add feeds/*", async () => {
    // Prepare
    const url = "http://example.com/atom";
    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<feed
  xmlns="http://www.w3.org/2005/Atom"
  xmlns:thr="http://purl.org/syndication/thread/1.0"
  xml:lang="ja"
>
  <title type="text">コンピュータ・ユニオン</title>
  <subtitle type="text">電算労コンピュータ関連労働組合</subtitle>
  <updated>2025-05-15T10:23:34Z</updated>
  <link rel="alternate" type="text/html" href="https://computer-union.jp" />
  <id>https://computer-union.jp/?feed=atom</id>
  <link rel="self" type="application/atom+xml" href="https://computer-union.jp/?feed=atom" />
  <generator uri="https://wordpress.org/" version="6.8.1">WordPress</generator>
  <entry>
    <author><name>ソフトウェアセクション</name></author>
    <title type="html"><![CDATA[&#8217;25/6【リモート】PHP：生産管理システムリニューアル]]></title>
    <link rel="alternate" type="text/html" href="https://computer-union.jp/?p=7612" />
    <id>https://computer-union.jp/?p=7612</id>
    <updated>2025-05-15T10:23:34Z</updated>
    <published>2025-05-15T10:23:34Z</published>
    <category scheme="https://computer-union.jp" term="しごと情報" />
    <summary type="html"><![CDATA[職種 SE 契約額 〜70万円 期間 &#8217;25年7月〜中長期 業務内容 詳細設計から参画いただきます。 管理番号:3829]]></summary>
  </entry>
  <entry>
    <author><name>ソフトウェアセクション</name></author>
    <title type="html"><![CDATA[&#8217;25/6【リモート/都内】ERP導入支援コンサルタント]]></title>
    <link rel="alternate" type="text/html" href="https://computer-union.jp/?p=7610" />
    <id>https://computer-union.jp/?p=7610</id>
    <updated>2025-05-15T10:20:43Z</updated>
    <published>2025-05-15T10:20:43Z</published>
    <category scheme="https://computer-union.jp" term="しごと情報" />
    <summary type="html"><![CDATA[職種 コンサルタント 契約額 〜110万円 期間 &#8217;25年5月〜 業務内容 大手企業向けに導入されるERPパッケージ [&#8230;]]]></summary>
  </entry>
</feed>`;
    const expectedData = [
      {
        title: "’25/6【リモート】PHP：生産管理システムリニューアル",
        link: "https://computer-union.jp/?p=7612",
        description:
          "職種 SE 契約額 〜70万円 期間 ’25年7月〜中長期 業務内容 詳細設計から参画いただきます。 管理番号:3829",
        pubDate: Timestamp.fromDate(new Date("2025-05-15T10:23:34.000Z")),
        category: "しごと情報",
        feed: url,
        status: "new",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        title: "’25/6【リモート/都内】ERP導入支援コンサルタント",
        link: "https://computer-union.jp/?p=7610",
        description:
          "職種 コンサルタント 契約額 〜110万円 期間 ’25年5月〜 業務内容 大手企業向けに導入されるERPパッケージ […]",
        pubDate: Timestamp.fromDate(new Date("2025-05-15T10:20:43.000Z")),
        category: "しごと情報",
        feed: url,
        status: "new",
        updatedAt: FieldValue.serverTimestamp(),
      },
    ];

    httpRequest.mockResolvedValue({
      data: { text: () => Promise.resolve(xml) },
    });
    refMock.get
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ exists: true });
    const feedReader = new FeedReader(db);

    // Execute
    await feedReader.readFeed(url);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[url]]);
    expect(db.collection.mock.calls).toEqual([["feeds"], ["feeds"]]);
    expect(collectionMock.doc.mock.calls).toEqual([
      [linkToId(expectedData[0].link)],
      [linkToId(expectedData[1].link)],
    ]);
    expect(refMock.get.mock.calls).toEqual([[], []]);
    expect(refMock.set.mock.calls).toEqual([[expectedData[0]]]);
    expect(refMock.update.mock.calls).toEqual([[expectedData[1]]]);
  });

  it("should handle invalid feed format", async () => {
    // Prepare
    const url = "http://example.com/invalid";
    const xml = "<invalid></invalid>";
    httpRequest.mockResolvedValue({
      data: { text: () => Promise.resolve(xml) },
    });
    const feedReader = new FeedReader(db);

    // Execute
    await feedReader.readFeed(url);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[url]]);
    expect(db.collection.mock.calls).toEqual([]);
    expect(collectionMock.doc.mock.calls).toEqual([]);
  });

  it("should handle httpRequest error", async () => {
    // Prepare
    const url = "http://example.com/error";
    const errorMessage = "Network error";
    httpRequest.mockResolvedValue({ err: errorMessage });
    const feedReader = new FeedReader(db);

    // Execute
    const result = await feedReader.readFeed(url);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[url]]);
    expect(result).toEqual({ err: `${url} ${errorMessage}` });
  });
});

describe("readAll()", () => {
  const feeds = ["http://example.com/rss2", "http://example.com/atom"];

  it("should read all feeds.", async () => {
    // Prepare
    FeedReader.prototype.getFeedUrls = vi.fn(() => Promise.resolve(feeds));
    FeedReader.prototype.readFeed = vi.fn();
    FeedReader.prototype.readFeed.mockResolvedValue({});

    // Execute
    const feedReader = new FeedReader(db);
    const ret = await feedReader.readAll();

    // Verify
    expect(FeedReader.prototype.getFeedUrls.mock.calls).toEqual([[]]);
    expect(FeedReader.prototype.readFeed.mock.calls).toEqual([
      [feeds[0]],
      [feeds[1]],
    ]);
    expect(ret).toEqual({});
  });

  it("should handle readFeed error", async () => {
    // Prepare
    FeedReader.prototype.readFeed = vi.fn();
    FeedReader.prototype.readFeed
      .mockResolvedValueOnce({ err: null })
      .mockResolvedValueOnce({ err: `${feeds[1]} test error` });
    refMock.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ feeds }),
    });

    // Execute
    const feedReader = new FeedReader(db);
    const ret = await feedReader.readAll();

    // Verify
    expect(FeedReader.prototype.readFeed.mock.calls).toEqual([
      [feeds[0]],
      [feeds[1]],
    ]);
    expect(ret).toEqual({ err: `["${feeds[1]} test error"]` });
  });
});
