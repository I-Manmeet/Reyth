var express = require("express");
var fileuploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var mysql2 = require("mysql2");

const transporter = require('./utils/mailer');


function sendWelcomeMail(toEmail, name, role) {
    const mailOptions = {
        from: 'Reyth reythbusiness31@gmail.com',
        to: toEmail,
        subject: `Welcome to Reyth, ${name}!`,
        html: `<h2>Hey ${name},</h2><p>You're now registered as a <strong>${role}</strong> on Reyth! 🏆<br>Let's get you in the game!</p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) console.log("❌ Email error: ", error);
        else console.log("📧 Email sent: " + info.response);
    });
}

function sendLoginAlert(toEmail, role) {
    const mailOptions = {
        from: 'Reyth <your_email@gmail.com>',
        to: toEmail,
        subject: `Login Alert from Reyth`,
        html: `<p>Hello,</p><p>Your <strong>${role}</strong> account just logged in to Reyth. If this wasn’t you, change your password.</p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) console.log("❌ Email error: ", error);
        else console.log("📧 Login alert sent: " + info.response);
    });
}




var app = express();//app() returns an Object:app
app.use(fileuploader());//for receiving files from client and save on server files
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDHUd4u_lXqLf9HhE4NWn83Sr-L5qtWTpA");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });




app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.listen(2004, function () {
    console.log("Server Started at Port no: 2004");
})

let dbConfig = "mysql://avnadmin:AVNS_Y5sJj_IDMBMLQJ6UZjp@mysql-3a66603-kmanmeet301-a8f2.c.aivencloud.com:26948/defaultdb?ssl-mode=REQUIRED";
let mySqlVen = mysql2.createPool(dbConfig);
console.log("Aiven connected sucessfully");
// mySqlVen.connect(function(errKuch)
// {
//     if (errKuch==null)
//          console.log("Aiven connected sucessfully");

//     else
//         console.log(errKuch.message)
// })

cloudinary.config({
    cloud_name: 'ddabgyvqg',
    api_key: '158769755219222',
    api_secret: 'k_YcBy4ri2Z3_5B0uY-oGXFCLzE',
    //Click 'View API Keys' above to copy your API secret
})


app.get("/", function (req, resp) {
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
})



app.get("/signup", function (req, resp) {
    let emailid = req.query.txtEmail;
    let pwd = req.query.txtPwd;
    let utype = req.query.utype;

    mySqlVen.query("insert into users(emailid,password,utype,dos,status) values(?,?,?,current_date(),1)", [emailid, pwd, utype], function (errKuch, result) {
        if (errKuch == null) {
            resp.send("Record Saved successfully");
            sendWelcomeMail(emailid, emailid.split("@")[0], utype);

        }


        else
            resp.send("Error: " + errKuch.message)

    })


})

app.get("/chk-email",function(req,resp){
    let email=req.query.txtEmail;
    mySqlVen.query("select * from users where emailid=?",[email],function(errKuch,result){
        if (result.length==0)
            resp.send("Email is available ✅");
        else {
            resp.send("Email is already taken ❌");
        }
        if (errKuch){
            resp.send(errKuch.message);
        }
    })
})



app.get("/login", function (req, resp) {
    let emailid = req.query.logEmail;
    let pwd = req.query.logPwd;
    let query = "Select * from users where emailid=? and password=?";
    mySqlVen.query(query, [emailid, pwd], function (errKuch, result) {
        if (result.length == 0) {   
            resp.send("Invalid");

        }
        else if (result[0].status==1){
            resp.send(result[0].utype);
            sendLoginAlert(emailid, result[0].utype);

        }
        else{
            resp.send("Blocked");
        }
    })
})




app.post("/org-details", async function (req, resp) {
    let emailid = req.body.emailid;
    let orgname = req.body.orgname;
    let regnumber = req.body.regnumber;
    let address = req.body.address;
    let city = req.body.city;
    let sports = req.body.sports;
    let website = req.body.website;
    let insta = req.body.insta;
    let head = req.body.head;
    let contact = req.body.contact;
    let otherinfo = req.body.otherinfo;
    let picurl = "";
    if (req.files != null) {
        let fName = req.files.picurl.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        req.files.picurl.mv(fullPath);
        await cloudinary.uploader.upload(fullPath).then(function (picURLResult) {
            picurl = picURLResult.url;
        })
    }
    else
        picurl = "nopic.jpg";


    let query = "INSERT INTO organizers(emailid, orgname, regnumber, address, city, sports, website, insta, head, contact, picurl, otherinfo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    mySqlVen.query(query, [emailid, orgname, regnumber, address, city, sports, website, insta, head, contact, picurl, otherinfo], function (errKuch) {
        if (errKuch == null) {
            resp.send("Record Saved Successfully")
        }
        else {
            resp.send(errKuch);
        }
    })

})




app.get("/get-org-detail", function (req, resp) {
    mySqlVen.query("select * from organizers where emailid=?", [req.query.emailid], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else{
             resp.json(allRecords);
             console.log("hi")
        }
        
           
    })
})


app.post("/update-org-details", async function (req, resp) {
    let picurl = "";
   
    if (req.files != null) //user wants to Update Profile Pic
    {
        let fName = req.files.picurl.name;


        let fullPath = __dirname + "/public/uploads/" + fName;
        req.files.profilePic.mv(fullPath);
       
      

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server


        }

        );
        
    }
    else {
        picurl = req.body.hdn;
       
    }

    let emailid = req.body.emailid;
    let orgname = req.body.orgname;
    let regnumber = req.body.regnumber;
    let city = req.body.city;
    let sports = req.body.sports;
    let website= req.body.website;
    let insta=req.body.insta;
    let head=req.body.head;
    let contact = req.body.contact;
    let otherinfo = req.body.otherinfo;
   

   


   
  
   
  

    let query = "update organizers set orgname=?,regnumber=?,city=?,sports=?,website=?,insta=?,head=?,contact=?,otherinfo=?,picurl=? where emailid=?";
    mySqlVen.query(query, [orgname, regnumber,city, sports,website,insta,head,contact, otherinfo,picurl, emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send("Record Saved Successfully");
            else
                resp.send("Inavlid email Id");
        }
        else
            resp.send(errKuch.message);
    })
})







app.get("/post-event", function (req, resp) {
    let emailid = req.query.emailid;
    let event = req.query.event;
    let doe = req.query.doe;
    let toe = req.query.toe;
    let address = req.query.address;
    let city = req.query.city;
    let sports = "";
    if (Array.isArray(req.query.sports)) {
        for (i = 0; i < req.query.sports.length; i++) {
            sports = sports + req.query.sports[i] + ",";
        }
    }
    else
        sports = req.query.sports;

    let minage = req.query.minage;
    let maxage = req.query.maxage;
    let lastdate = req.query.lastdate;
    let fee = req.query.fee;
    let prize = req.query.prize;
    let contact = req.query.contact;



    let query = "INSERT INTO tournaments(emailid, event, doe,toe, address, city, sports, minage, maxage, lastdate, fee, prize, contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
    mySqlVen.query(query, [emailid, event, doe, toe, address, city, sports, minage, maxage, lastdate, fee, prize, contact], function (errKuch) {
        if (errKuch == null) {
            resp.send("Event posted Successfully")
        }
        else {
            resp.send(errKuch);
        }
    })



})



app.get("/fetch-all-tournaments", function (req, resp) {
    let emailid = req.query.emailid;
    mySqlVen.query("select * from tournaments where emailid = ?", [emailid], function (err, allRecords) {
        resp.send(allRecords);
    });
})


app.get("/delete-one", function (req, resp) {
    console.log(req.query)

    let rid = req.query.rid;

    mySqlVen.query("delete from tournaments where rid=?", [rid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(" Deleted Successfulllyyyy...");
            else
                resp.send("Invalid Email id");
        }
        else
            resp.send(errKuch);

    })
})



async function RajeshBansalKaChirag(imgurl)
{
const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."   
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())
            
            const cleaned = result.response.text().replace(/```json|```/g, '').trim();
            const jsonData = JSON.parse(cleaned);
            console.log(jsonData);

    return jsonData

}


app.post("/player-details", async function (req, resp) {
    let emailid = req.body.emailid;
    let acardpicurl = "";
    let jsonData=[];
   try{
    if (req.files != null) {
        let fName = req.files.acardpicurl.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        await req.files.acardpicurl.mv(fullPath);
        
        await cloudinary.uploader.upload(fullPath).then( async function (picURLResult) {
            acardpicurl = picURLResult.url;

            jsonData=await RajeshBansalKaChirag(acardpicurl);
        });}
    
    else
        acardpicurl = "nopic.jpg";
    }


    catch{
        console.log("Cloudinary crash")
    }

    let profilepicurl = "";
    if (req.files != null) {
        let fName = req.files.profilepicurl.name;
        let fullPath = __dirname + "/public/uploads/" + fName;
        req.files.profilepicurl.mv(fullPath);
        await cloudinary.uploader.upload(fullPath).then(function (picURLResult) {
            profilepicurl = picURLResult.url;
        })
    }
    else
        profilepicurl = "nopic.jpg";


    let address = req.body.address;

    let contact = req.body.contact;
    let game = req.body.game;

    let otherinfo = req.body.otherinfo;
    let dobParts = jsonData.dob.split("-");
    let dob = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;




    let query = "INSERT INTO players(emailid, acardpicurl, profilepicurl,name,dob,gender, address, contact, game,  otherinfo) VALUES (?, ?, ?, ?, ?, ?, ? ,?,?,?)";
    mySqlVen.query(query, [emailid, acardpicurl, profilepicurl, jsonData.name,dob,jsonData.gender, address,contact, game, otherinfo], function (errKuch) {
        if (errKuch == null) {
            resp.send("Record Saved Successfully")
        }
        else {
            resp.send(errKuch);
        }
    })

})



app.get("/get-one", function (req, resp) {
    mySqlVen.query("select * from players where emailid=?", [req.query.emailid], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else
            resp.json(allRecords);
    })
})




app.post("/update-player", async function (req, resp) {
    let apicurl = "";
    let ppicurl = "";
    if (req.files != null) //user wants to Update Profile Pic
    {
        let fName1 = req.files.acardpicurl.name;
        let fName2 = req.files.profilepicurl.name;

        let fullPath1 = __dirname + "/public/uploads/" + fName1;
        req.files.profilePicurl.mv(fullPath1);
        let fullPath2 = __dirname + "/public/uploads/" + fName2;
        req.files.profilePicurl.mv(fullPath2);

        await cloudinary.uploader.upload(fullPath1).then(function (picUrlResult) {
            apicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server


        }

        );
        await cloudinary.uploader.upload(fullPath2).then(function (picUrlResult) {
            ppicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server


        }

        );
    }
    else {
        ppicurl = req.body.hdn2;
        apicurl = req.body.hdn1;
    }

    let emailid = req.body.emailid;


    let address = req.body.address;

    let contact = req.body.contact;
    let game = req.body.game;

    let otherinfo = req.body.otherinfo;

    let query = "update players set address=?,contact=?,game=?,otherinfo=? where emailid=?";
    mySqlVen.query(query, [address, contact, game, otherinfo, emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send("Record Saved Successfully");
            else
                resp.send("Inavlid email Id");
        }
        else
            resp.send(errKuch.message);
    })
})





app.get("/fetch-all-users", function (req, resp) {
    mySqlVen.query("select * from users", function (err, allRecords) {
        resp.send(allRecords);
    })
})




app.get("/do-block", function (req, resp) {
    console.log(req.query)

    let emailid = req.query.emailid;

    mySqlVen.query("update users set status=0 where emailid=?", [emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send(" Blocked successfully");
            else
                resp.send("Invalid Email id");
        }
        else
            resp.send(errKuch);

    })
})



app.get("/do-resume", function (req, resp) {
    console.log(req.query)

    let emailid = req.query.emailid;

    mySqlVen.query("update users set status=1 where emailid=?", [emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send("The user is being resumed");
            else
                resp.send("Invalid Email id");
        }
        else
            resp.send(errKuch);

    })
})





app.get("/do-fetch-all-players", function (req, resp) {
    mySqlVen.query("select * from players", function (err, allRecords) {
        resp.send(allRecords);
    })
})





app.get("/do-fetch-all-organizers", function (req, resp) {
    mySqlVen.query("select * from organizers", function (err, allRecords) {
        resp.send(allRecords);
    })
})



app.get("/do-fetch-all-tournaments", function (req, resp) {
    console.log(req.query)
    mySqlVen.query("select * from tournaments where city=? and sports=?", [req.query.kuchCity, req.query.kuchGame], function (err, allRecords) {
        console.log(allRecords)
        resp.send(allRecords);
    })
})




app.get("/do-fetch-all-cities", function (req, resp) {
    mySqlVen.query("select distinct city from tournaments", function (err, allRecords) {
        resp.send(allRecords);
    })
})





app.get("/update-password", function (req, resp) {
    console.log(req.query)

    let emailid = req.query.emailid;
    let password = req.query.password;
    let newPassword = req.query.newPassword;

    mySqlVen.query("update users set password=? where emailid=? and password=?", [newPassword,emailid,password], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send("Password updated successfully");
            else
                resp.send("Invalid Email id or password");
        }
        else
            resp.send(errKuch);

    })
})