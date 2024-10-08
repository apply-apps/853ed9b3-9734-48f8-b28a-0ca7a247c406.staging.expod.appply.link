// App.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Clipboard } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://apihub.staging.appply.link/chatgpt';

const App = () => {
  const [recording, setRecording] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [waveform, setWaveform] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setWaveform(prevWaveform => [
          ...prevWaveform,
          Math.random() * 50 + 10
        ].slice(-30));
      }, 100);
    } else {
      setWaveform([]);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        stopRecording();
      }, 60000);
    } catch (err) {
      setError('Failed to start recording');
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    transcribeAudio(uri);
  }

  async function transcribeAudio(uri) {
    try {
      const response = await axios.post(API_URL, {
        messages: [
          { role: "system", content: "You are a helpful assistant that transcribes audio to text." },
          { role: "user", content: `Please transcribe the following audio: ${uri}` }
        ],
        model: "gpt-4o"
      });
      const { data } = response;
      setTranscription(data.response);
    } catch (err) {
      setError('Failed to transcribe audio');
    }
  }

  const handleCopyText = () => {
    Clipboard.setString(transcription);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderTutorial = () => (
    <View style={styles.tutorialOverlay}>
      <Text style={styles.tutorialText}>
        Welcome to the Voice Recorder & Transcriber!
        {'\n\n'}
        1. Tap the red button to start recording.
        {'\n'}
        2. Speak for up to 60 seconds.
        {'\n'}
        3. The app will automatically stop and transcribe your speech.
        {'\n'}
        4. Edit the transcription if needed.
        {'\n'}
        5. Tap 'Copy' to copy the text.
      </Text>
      <TouchableOpacity style={styles.tutorialButton} onPress={() => setShowTutorial(false)}>
        <Text style={styles.tutorialButtonText}>Got it!</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {showTutorial && renderTutorial()}
      <View style={styles.waveformContainer}>
        {waveform.map((height, index) => (
          <View key={index} style={[styles.waveformBar, { height }]} />
        ))}
      </View>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Ionicons name={isRecording ? "stop" : "mic"} size={32} color="white" />
      </TouchableOpacity>
      <TextInput
        style={styles.transcriptionInput}
        multiline
        value={transcription}
        onChangeText={setTranscription}
        placeholder="Transcription will appear here..."
      />
      <TouchableOpacity style={styles.copyButton} onPress={handleCopyText}>
        <Text style={styles.copyButtonText}>Copy</Text>
      </TouchableOpacity>
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
    width: '100%',
    marginBottom: 20,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#ff4136',
    marginHorizontal: 1,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff4136',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: '#ff725c',
  },
  transcriptionInput: {
    width: '100%',
    height: 200,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  copyButton: {
    backgroundColor: '#0074D9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  tutorialButton: {
    backgroundColor: '#0074D9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  tutorialButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default App;
// End of App.js