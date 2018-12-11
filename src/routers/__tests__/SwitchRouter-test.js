/* eslint react/display-name:0 */

import React from 'react';
import SwitchRouter from '../SwitchRouter';
import StackRouter from '../StackRouter';
import NavigationActions from '../../NavigationActions';

describe('SwitchRouter', () => {
  test('resets the route when unfocusing a tab by default', () => {
    const router = getExampleRouter();
    const state = router.getStateForAction({ type: NavigationActions.INIT });
    const state2 = router.getStateForAction(
      { type: NavigationActions.NAVIGATE, routeName: 'A2' },
      state
    );
    expect(state2.routes[0].index).toEqual(1);
    expect(state2.routes[0].routes.length).toEqual(2);

    const state3 = router.getStateForAction(
      { type: NavigationActions.NAVIGATE, routeName: 'B' },
      state2
    );

    expect(state3.routes[0].index).toEqual(0);
    expect(state3.routes[0].routes.length).toEqual(1);
  });

  test('does not reset the route on unfocus if resetOnBlur is false', () => {
    const router = getExampleRouter({ resetOnBlur: false });
    const state = router.getStateForAction({ type: NavigationActions.INIT });
    const state2 = router.getStateForAction(
      { type: NavigationActions.NAVIGATE, routeName: 'A2' },
      state
    );
    expect(state2.routes[0].index).toEqual(1);
    expect(state2.routes[0].routes.length).toEqual(2);

    const state3 = router.getStateForAction(
      { type: NavigationActions.NAVIGATE, routeName: 'B' },
      state2
    );

    expect(state3.routes[0].index).toEqual(1);
    expect(state3.routes[0].routes.length).toEqual(2);
  });

  test('ignores back by default', () => {
    const router = getExampleRouter();
    const state = router.getStateForAction({ type: NavigationActions.INIT });
    const state2 = router.getStateForAction(
      { type: NavigationActions.NAVIGATE, routeName: 'B' },
      state
    );
    expect(state2.index).toEqual(1);

    const state3 = router.getStateForAction(
      { type: NavigationActions.BACK },
      state2
    );

    expect(state3.index).toEqual(1);
  });

  test('handles back if given a backBehavior', () => {
    const router = getExampleRouter({ backBehavior: 'initialRoute' });
    const state = router.getStateForAction({ type: NavigationActions.INIT });
    const state2 = router.getStateForAction(
      { type: NavigationActions.NAVIGATE, routeName: 'B' },
      state
    );
    expect(state2.index).toEqual(1);

    const state3 = router.getStateForAction(
      { type: NavigationActions.BACK },
      state2
    );

    expect(state3.index).toEqual(0);
  });

  test('handles nested actions', () => {
    const router = getExampleRouter();
    const state = router.getStateForAction({ type: NavigationActions.INIT });
    const state2 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'B',
        action: { type: NavigationActions.NAVIGATE, routeName: 'B2' },
      },
      state
    );
    const subState = state2.routes[state2.index];
    const activeGrandChildRoute = subState.routes[subState.index];
    expect(activeGrandChildRoute.routeName).toEqual('B2');
  });

  test('explicit param mode guards against conflicting param names', () => {
    const PlainScreen = () => <div />;
    const SwitchA = () => <div />;

    SwitchA.router = SwitchRouter({
      A1: {
        screen: PlainScreen,
        path: 'a1/:name',
      },
      A2: PlainScreen,
    });

    expect(() => {
      SwitchRouter(
        {
          A: {
            screen: SwitchA,
            path: 'a/:name',
          },
          B: PlainScreen,
        },
        {
          explicitParams: true,
        }
      );
    }).toThrow();
  });

  test('explicit param mode on deep conflicting param names', () => {
    const PlainScreen = () => <div />;
    const SwitchA = () => <div />;
    const SwitchFoo = () => <div />;

    SwitchFoo.router = SwitchRouter({
      A1: {
        screen: PlainScreen,
        path: 'a1/:name',
      },
      A2: PlainScreen,
    });

    SwitchA.router = SwitchRouter({
      Foo: {
        screen: SwitchFoo,
      },
      Bar: PlainScreen,
    });

    expect(() => {
      SwitchRouter(
        {
          A: {
            screen: SwitchA,
            path: 'a/:name',
          },
          B: PlainScreen,
        },
        {
          explicitParams: true,
        }
      );
    }).toThrow();
  });

  test('inherit params', () => {
    const PlainScreen = () => <div />;
    const SwitchA = () => <div />;

    SwitchA.router = SwitchRouter({
      A1: {
        screen: PlainScreen,
        path: 'a1',
        inheritParams: ['name'],
        params: { age: null },
      },
      A2: PlainScreen,
    });

    const router = SwitchRouter(
      {
        A: {
          screen: SwitchA,
          path: 'a/:name',
        },
        B: PlainScreen,
      },
      {
        explicitParams: true,
      }
    );
    const s1 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'A',
        params: { name: 'Lucy' },
      },
      null
    );
    const activeRoute = s1.routes[s1.index];
    expect(activeRoute.routeName).toEqual('A');
    expect(activeRoute.params).toEqual({ name: 'Lucy' });
    const activeChildRoute = activeRoute.routes[activeRoute.index];
    expect(activeChildRoute.routeName).toEqual('A1');
    expect(activeChildRoute.params).toEqual({ name: 'Lucy', age: null });
  });

  test('inherit deep params. navigate applies params on correct route', () => {
    const PlainScreen = () => <div />;
    const SwitchA = () => <div />;
    const SwitchA1 = () => <div />;

    SwitchA1.router = SwitchRouter({
      z1: {
        screen: PlainScreen,
        inheritParams: ['name', 'age'],
      },
      z2: PlainScreen,
    });

    SwitchA.router = SwitchRouter({
      A1: {
        screen: SwitchA1,
        path: 'a1',
        inheritParams: ['name'],
        params: { age: null },
      },
      A2: PlainScreen,
    });

    const router = SwitchRouter(
      {
        B: PlainScreen,
        A: {
          screen: SwitchA,
          path: 'a/:name',
        },
      },
      {
        explicitParams: true,
      }
    );
    const s1 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'A',
        params: { name: 'Lucy' },
        action: {
          type: NavigationActions.NAVIGATE,
          routeName: 'A1',
          params: { age: 123 },
        },
      },
      null
    );
    const activeRoute = s1.routes[s1.index];
    expect(activeRoute.routeName).toEqual('A');
    expect(activeRoute.params).toEqual({ name: 'Lucy' });
    const activeChildRoute = activeRoute.routes[activeRoute.index];
    expect(activeChildRoute.routeName).toEqual('A1');
    expect(activeChildRoute.params).toEqual({ name: 'Lucy', age: 123 });
    const activeBabyRoute = activeChildRoute.routes[activeChildRoute.index];
    expect(activeBabyRoute.routeName).toEqual('z1');
    expect(activeBabyRoute.params).toEqual({ name: 'Lucy', age: 123 });
  });

  test('handles nested actions and params simultaneously', () => {
    const router = getExampleRouter();
    const state = router.getStateForAction({ type: NavigationActions.INIT });
    const state2 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'B',
        params: { foo: 'bar' },
        action: { type: NavigationActions.NAVIGATE, routeName: 'B2' },
      },
      state
    );
    const subState = state2.routes[state2.index];
    const activeGrandChildRoute = subState.routes[subState.index];
    expect(subState.params.foo).toEqual('bar');
    expect(activeGrandChildRoute.routeName).toEqual('B2');
  });

  test('order of handling navigate action is correct for nested switchrouters', () => {
    // router = switch({ Nested: switch({ Foo, Bar }), Other: switch({ Foo }), Bar })
    // if we are focused on Other and navigate to Bar, what should happen?

    const Screen = () => <div />;
    const NestedSwitch = () => <div />;
    const OtherNestedSwitch = () => <div />;

    let nestedRouter = SwitchRouter({ Foo: Screen, Bar: Screen });
    let otherNestedRouter = SwitchRouter({ Foo: Screen });
    NestedSwitch.router = nestedRouter;
    OtherNestedSwitch.router = otherNestedRouter;

    let router = SwitchRouter(
      {
        NestedSwitch,
        OtherNestedSwitch,
        Bar: Screen,
      },
      {
        initialRouteName: 'OtherNestedSwitch',
      }
    );

    const state = router.getStateForAction({ type: NavigationActions.INIT });
    expect(state.routes[state.index].routeName).toEqual('OtherNestedSwitch');

    const state2 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'Bar',
      },
      state
    );
    expect(state2.routes[state2.index].routeName).toEqual('Bar');

    const state3 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'NestedSwitch',
      },
      state2
    );
    const state4 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'Bar',
      },
      state3
    );
    let activeState4 = state4.routes[state4.index];
    expect(activeState4.routeName).toEqual('NestedSwitch');
    expect(activeState4.routes[activeState4.index].routeName).toEqual('Bar');
  });

  // https://github.com/react-navigation/react-navigation.github.io/issues/117#issuecomment-385597628
  test('order of handling navigate action is correct for nested stackrouters', () => {
    const Screen = () => <div />;
    const MainStack = () => <div />;
    const LoginStack = () => <div />;
    MainStack.router = StackRouter({ Home: Screen, Profile: Screen });
    LoginStack.router = StackRouter({ Form: Screen, ForgotPassword: Screen });

    let router = SwitchRouter(
      {
        Home: Screen,
        Login: LoginStack,
        Main: MainStack,
      },
      {
        initialRouteName: 'Login',
      }
    );

    const state = router.getStateForAction({ type: NavigationActions.INIT });
    expect(state.routes[state.index].routeName).toEqual('Login');

    const state2 = router.getStateForAction(
      {
        type: NavigationActions.NAVIGATE,
        routeName: 'Home',
      },
      state
    );
    expect(state2.routes[state2.index].routeName).toEqual('Home');
  });
});

const getExampleRouter = (config = {}) => {
  const PlainScreen = () => <div />;
  const StackA = () => <div />;
  const StackB = () => <div />;

  StackA.router = StackRouter({
    A1: PlainScreen,
    A2: PlainScreen,
  });

  StackB.router = StackRouter({
    B1: PlainScreen,
    B2: PlainScreen,
  });

  const router = SwitchRouter(
    {
      A: {
        screen: StackA,
        path: '',
      },
      B: {
        screen: StackB,
        path: 'great/path',
      },
    },
    {
      initialRouteName: 'A',
      ...config,
    }
  );

  return router;
};
