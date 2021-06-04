import React from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  PermissionsAndroid,
  TextInput,
  Button,
  Text,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import {WebView} from 'react-native-webview';
import { WebViewNativeEvent } from 'react-native-webview/lib/WebViewTypes';
import {requestMultiple, PERMISSIONS} from 'react-native-permissions';


const stagingBaseURI = "https://capture.kyc.idfystaging.com";
const prodBaseURI = "https://capture.kyc.idfy.com";

const requestAllPermissions = async () => {
  if(Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    } catch (err) {
      console.warn(err);
    }
  } else if (Platform.OS === 'ios') {
    const result = await requestMultiple([PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.LOCATION_WHEN_IN_USE, PERMISSIONS.IOS.MICROPHONE]);
    console.log(result);
  }
};

interface Props {}

interface State {
  url: string;
  launchWebview: boolean;
  isLoading: boolean;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      url: '',
      launchWebview: false,
      isLoading: false,
    };
    this.onChangeText = this.onChangeText.bind(this);
    this.launch = this.launch.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
  }
  webviewRef = React.createRef();

  componentDidMount() {
    requestAllPermissions();
  }

  onChangeText(value: string) {
    this.setState({url: value});
  }

  validURL(str: string): boolean {
      return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(str);
  }

  launch() {
    if (this.state.url && this.validURL(this.state.url) && (this.state.url.includes(stagingBaseURI) || this.state.url.includes(prodBaseURI))) {
      this.setState({launchWebview: true});
    } else {
      Alert.alert('Please enter valid url');
    }
  }

  onStateChange(state: WebViewNativeEvent) {
    if(!state.url.includes(stagingBaseURI) && !state.url.includes(prodBaseURI)){
      this.setState({launchWebview: false})
    }
  }

  render() {
    return (
      <SafeAreaView style={[styles.container, styles.horizontal]}>
        <StatusBar backgroundColor="#000000" barStyle="light-content" hidden={true} />
        {!this.state.launchWebview && (
          <View style={[styles.inputHolder]}>
            <View style={styles.flex}>
              <Text >Please Enter the Capture Link to open in webview</Text>
            </View>
            <View style={[styles.input, styles.flex]}>
              <TextInput
                placeholder="Enter Url"
                onChangeText={this.onChangeText}
                value={this.state.url}
              />
            </View>
            <View style={styles.flex}>
              <Button onPress={this.launch} title="Launch" />
            </View>
          </View>
        )}
        {this.state.launchWebview && (
          <>
            <WebView
              source={{
                uri: this.state.url,
              }}
              onNavigationStateChange={this.onStateChange}
              autoManageStatusBarEnabled={false}
              geolocationEnabled={true}
              javaScriptEnabled={true}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
            />
          </>
        )}
      </SafeAreaView>
    );
  } 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    display: 'flex',
    marginBottom: '10%'
  },
  inputHolder: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    maxWidth: 300,
    borderWidth: 1,
    display: 'flex'
  },
  spinnerTextStyle: {
    color: '#e60e3b',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default App;
