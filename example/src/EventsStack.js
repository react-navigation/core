import React from 'react';
import { Button, ScrollView, View, Text } from 'react-native';
import { withNavigation } from '@react-navigation/core';
import { createStackNavigator } from 'react-navigation-stack';

const getColorOfEvent = evt => {
  switch (evt) {
    case 'willFocus':
      return 'purple';
    case 'didFocus':
      return 'blue';
    case 'willBlur':
      return 'brown';
    default:
      return 'black';
  }
};
class FocusTagWithNav extends React.Component {
  state = { mode: 'didBlur' };
  componentDidMount() {
    this.props.navigation.addListener('willFocus', () => {
      this.setMode('willFocus');
    });
    this.props.navigation.addListener('willBlur', () => {
      this.setMode('willBlur');
    });
    this.props.navigation.addListener('didFocus', () => {
      this.setMode('didFocus');
    });
    this.props.navigation.addListener('didBlur', () => {
      this.setMode('didBlur');
    });
  }
  setMode = mode => {
    if (!this._isUnmounted) {
      this.setState({ mode });
    }
  };
  componentWillUnmount() {
    this._isUnmounted = true;
  }
  render() {
    const key = this.props.navigation.state.key;
    return (
      <View
        style={{
          padding: 20,
          backgroundColor: getColorOfEvent(this.state.mode),
        }}
      >
        <Text style={{ color: 'white' }}>
          {key} {String(this.state.mode)}
        </Text>
      </View>
    );
  }
}

const FocusTag = withNavigation(FocusTagWithNav);

class SampleScreen extends React.Component {
  state = {
    observedEvents: [],
  };
  static navigationOptions = ({ navigation }) => ({
    title: navigation.state.routeName,
    headerRight: navigation.getParam('nextPage') ? (
      <Button
        title="Next"
        onPress={() => navigation.navigate(navigation.getParam('nextPage'))}
      />
    ) : null,
  });

  componentDidMount() {
    const { addListener, state } = this.props.navigation;

    const reportEvent = (evtName, evt) => {
      if (evt.type === 'didBlur') {
        alert('Reporting blur for ' + state.routeName);
      }
      this.setState(state => ({
        observedEvents: [...state.observedEvents, evt],
      }));
    };
    this._subs = [
      addListener('refocus', () => {
        if (this.props.navigation.isFocused()) {
          this.scrollView.scrollTo({ x: 0, y: 0 });
        }
      }),
      addListener('willFocus', evt => reportEvent('willFocus', evt)),
      addListener('willBlur', evt => reportEvent('willBlur', evt)),
      addListener('didFocus', evt => reportEvent('didFocus', evt)),
      addListener('didBlur', evt => reportEvent('didBlur', evt)),
    ];
  }
  componentWillUnmount() {
    this._subs.forEach(subscription => {
      subscription.remove();
    });
  }
  render() {
    return (
      <ScrollView
        ref={view => {
          this.scrollView = view;
        }}
        style={{
          flex: 1,
          backgroundColor: '#fff',
        }}
      >
        <FocusTag />
        <Text
          onPress={() => {
            this.props.navigation.push('PageTwo');
          }}
        >
          Push
        </Text>
        <Text
          onPress={() => {
            const { push, goBack } = this.props.navigation;
            push('PageTwo');
            setTimeout(() => {
              goBack(null);
            }, 150);
          }}
        >
          Push and Pop Quickly
        </Text>
        <Text
          onPress={() => {
            this.props.navigation.navigate('Home');
          }}
        >
          Back to Examples
        </Text>
        {this.state.observedEvents.map((evt, index) => (
          <Text key={index} style={{ color: '#444' }}>
            {evt.type}
          </Text>
        ))}
      </ScrollView>
    );
  }
}

const SimpleStack = createStackNavigator(
  {
    PageOne: {
      screen: SampleScreen,
    },
    PageTwo: {
      screen: SampleScreen,
    },
  },
  {
    initialRouteName: 'PageOne',
  }
);

export default SimpleStack;
