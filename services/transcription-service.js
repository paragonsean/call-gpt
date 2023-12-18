const { Deepgram } = require("@deepgram/sdk");
const EventEmitter = require("events");


class TranscriptionService extends EventEmitter {
  constructor() {
    super();
    const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
    this.deepgramLive = deepgram.transcription.live({
      encoding: "mulaw",
      sample_rate: "8000",
      model: "nova-2",
      punctuate: true,
      interim_results: true,
      endpointing: 200,
    });

    this.finalResult = "";

    this.deepgramLive.addListener("transcriptReceived", (transcriptionMessage) => {
      const transcription = JSON.parse(transcriptionMessage);
      const text = transcription.channel?.alternatives[0]?.transcript;
      console.log(text, "is_final: ", transcription?.is_final, "speech_final: ", transcription.speech_final);
      // if (transcription.is_final === true) {
      //   this.finalResult += text;
        if (transcription.speech_final === true || transcription.is_final === true) {
          if (text.trim().length > 1) {
            this.emit("transcription", text);
            this.finalResult = "";
          }
          
        }
      // } else {
      //   this.emit("utterance", text);
      // }
    });

    this.deepgramLive.addListener("error", (error) => {
      console.error("deepgram error");
      console.error(error);
    });
    
    this.deepgramLive.addListener("close", () => {
      console.log("Deepgram connection closed");
    });
  }

  /**
   * Send the payload to Deepgram
   * @param {String} payload A base64 MULAW/8000 audio stream
   */
  send(payload) {
    // TODO: Buffer up the media and then send
    if (this.deepgramLive.getReadyState() === 1) {
      this.deepgramLive.send(Buffer.from(payload, "base64"));
    }
  }
}

module.exports = { TranscriptionService }