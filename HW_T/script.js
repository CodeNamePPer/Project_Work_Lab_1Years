const profileData = {
      th: `
        ชื่อ: ใจดี สบายดี <br>
        รหัสนักศึกษา: 67010101 <br>
        สาขาวิชา: วิทยาการคอมพิวเตอร์ <br>
        ชั้นปี: ปีที่ 1 <br>
        อายุ: 21 ปี <br>
        วันเกิด: 15 มิถุนายน 2543 <br>
        อีเมล: krit@example.com <br>
        โทรศัพท์: 081-2345678
      `,
      en: `
        Name: Jaidee Sabaidee <br>
        ID: 67010101 <br>
        Major: Computer Science <br>
        Year: 1st Year <br>
        Age: 21 <br>
        Birthday: June 15, 2000 <br>
        Email: Jaidee@example.com <br>
        Phone: 081-2345678
      `
    };
    
    let currentLang = "th";
    document.getElementById("profile").innerHTML = profileData[currentLang];

    function toggleLang() {
      currentLang = (currentLang === "th") ? "en" : "th";
      document.getElementById("profile").innerHTML = profileData[currentLang];
    }