#Usage RestAPI  
1. Request  
- ssmltag : "<speak> hi man! i love you </speak>"
- voiceid : "Joanna

2. Response  
----------------------------943086751578906072270154  
Content-Disposition: form-data; name="ssml"  
<speak> hi man! i love you </speak>  
----------------------------943086751578906072270154  
Content-Disposition: form-data; name="voiceid"  
Joanna  
----------------------------943086751578906072270154  
Content-Disposition: form-data; name="file"; filename="mytest.wav"  
Content-Type: audio/wave  
RIFF.....blahblah_File_BytesData...blahblah  
----------------------------943086751578906072270154  

#How to use  
0. Install npm NodeJS Configuration
1. cmd>git clone https://github.com/guripong/amazon_tts_server.git
2. cmd>node tts.js

#Warnning
- Please set AWS Configuration at (./config/aws-config.json)
- You can change default port at (./tts.js)


