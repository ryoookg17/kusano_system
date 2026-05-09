export default function History() {
  const historyData = [
    { date: "1964年1月28日", desc: "有限会社くさの書店を設立\n代表取締役草野政吉" },
    { date: "1964年7月1日", desc: "店舗住所は大橋町7番21号" },
    { date: "1967年4月", desc: "長崎県立長崎北高校の教科書供給所になる" },
    { date: "1971年1月15日", desc: "中園町小笹ビル1階に初の支店を出店" },
    { date: "1971年5月", desc: "書籍のみの専売へ" },
    { date: "1972年7月", desc: "『五島列島全図』を編纂して出版" },
    { date: "1974年6月1日", desc: "中園町6番19号の現・住所を住吉店へ" },
    { date: "1987年6月15日", desc: "増築した住吉店の2・3階に売り場を拡大\n2階にてビデオ・CDのレンタル部門を新設" },
    { date: "1991年11月21日", desc: "チトセピア2階に出店" },
    { date: "1993年1月1日", desc: "草野義広が2代目社長に就任" },
    { date: "2004年11月26日", desc: "チトセピア店リニューアル" },
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "0 20px" }}>
      <h1 className="section-heading" style={{ display: "block", textAlign: "center", marginBottom: "3rem", borderBottom: "none" }}>書店の沿革</h1>

      <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <dl style={{ display: "flex", flexWrap: "wrap", margin: 0 }}>
          {historyData.map((item, i) => (
            <div key={i} style={{ display: "flex", width: "100%", borderBottom: "1px solid #eee" }}>
              <dt style={{ 
                width: "30%", 
                padding: "20px 10px", 
                fontWeight: "bold", 
                color: "var(--kusano-theme)",
                boxSizing: "border-box" 
              }}>
                {item.date}
              </dt>
              <dd style={{ 
                width: "70%", 
                margin: 0, 
                padding: "20px 10px", 
                lineHeight: "1.8",
                boxSizing: "border-box",
                whiteSpace: "pre-line"
              }}>
                {item.desc}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
