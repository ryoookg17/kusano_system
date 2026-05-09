export default function Stores() {
  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "0 20px" }}>
      <h1 className="section-heading" style={{ display: "block", textAlign: "center", marginBottom: "3rem", borderBottom: "none" }}>店舗紹介</h1>

      <article style={{ marginBottom: "40px", paddingBottom: "40px", borderBottom: "1px solid #eee" }}>
        <h2 className="section-heading">くさの書店 住吉店</h2>
        <div style={{ lineHeight: "1.8", fontSize: "16px", marginBottom: "20px" }}>
          <strong>住所:</strong> 〒852-8155 長崎県長崎市中園町6-19 1F<br />
          <strong>電話:</strong> <a href="tel:095-847-5782" style={{ color: "var(--kusano-theme)", textDecoration: "underline" }}>095-847-5782</a><br />
          <strong>営業時間:</strong> 10:00〜20:00 (隔週日曜定休日)
        </div>
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13416.102550646317!2d129.8496744699299!3d32.79157947851835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x356aace185357bef%3A0xaf27b076e44aa4a5!2z44GP44GV44Gu5pu45bqXIOS9j-WQieW6lw!5e0!3m2!1sja!2sjp!4v1761891313392!5m2!1sja!2sjp" 
            width="100%" 
            height="350" 
            style={{ border: 0, borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} 
            allowFullScreen={false} 
            loading="lazy">
          </iframe>
        </div>
      </article>

      <article style={{ marginBottom: "40px", paddingBottom: "40px", borderBottom: "1px solid #eee" }}>
        <h2 className="section-heading">くさの書店 チトセピア店</h2>
        <div style={{ lineHeight: "1.8", fontSize: "16px", marginBottom: "20px" }}>
          <strong>住所:</strong> 〒852-8135 長崎県長崎市千歳町5-1 チトセピア 2F<br />
          <strong>電話:</strong> <a href="tel:095-842-6001" style={{ color: "var(--kusano-theme)", textDecoration: "underline" }}>095-842-6001</a><br />
          <strong>営業時間:</strong> 10:00〜20:00
        </div>
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13416.298129426414!2d129.85115336992928!3d32.790282978527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x356aace11602977d%3A0xd8d24d83545b2ff4!2z44GP44GV44Gu5pu45bqXIOODgeODiOOCu-ODlOOCouW6lw!5e0!3m2!1sja!2sjp!4v1761891417249!5m2!1sja!2sjp"
            width="100%" 
            height="350" 
            style={{ border: 0, borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} 
            allowFullScreen={false} 
            loading="lazy">
          </iframe>
        </div>
      </article>

      <article style={{ marginBottom: "20px" }}>
        <h2 className="section-heading">くさの書店 外商部</h2>
        <div style={{ lineHeight: "1.8", fontSize: "16px", marginBottom: "20px" }}>
          <strong>住所:</strong> 〒852-8155 長崎県長崎市中園町6-19 4F<br />
          <strong>電話:</strong> <a href="tel:095-846-7534" style={{ color: "var(--kusano-theme)", textDecoration: "underline" }}>095-846-7534</a><br />
          <strong>FAX:</strong> <a href="fax:095-844-5185" style={{ color: "var(--kusano-theme)", textDecoration: "underline" }}>095-844-5185</a><br />
          <strong>営業時間:</strong> 10:00〜20:00 (隔週日曜定休日)
        </div>
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13416.102550646317!2d129.8496744699299!3d32.79157947851835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x356aace185357bef%3A0xaf27b076e44aa4a5!2z44GP44GV44Gu5pu45bqXIOS9j-WQieW6lw!5e0!3m2!1sja!2sjp!4v1761891313392!5m2!1sja!2sjp" 
            width="100%" 
            height="350" 
            style={{ border: 0, borderRadius: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} 
            allowFullScreen={false} 
            loading="lazy">
          </iframe>
        </div>
      </article>
    </div>
  );
}
