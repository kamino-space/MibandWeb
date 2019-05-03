import React, {Component} from 'react';
import MiBand from 'miband';
import test_all from './test';
import {Table} from 'antd';
import 'antd/dist/antd.css';

class Info extends Component {
    render() {
        const dataSource = [];
        const columns = [];
        return (
            <Table dataSource={dataSource} columns={columns}/>
        )
    }
}

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            support: true,
            connected: false,
            bluetooth: navigator.bluetooth,
        };
    }

    componentDidMount() {
        if (!this.state.bluetooth) {
            console.log('WebBluetooth is not supported by your browser!');
            this.setState({support: false});
        }
    }

    connect = () => {
        console.log('start connect');
        try {
            console.log('Requesting Bluetooth Device...');
            const device = this.state.bluetooth.requestDevice({
                filters: [
                    {services: [MiBand.advertisementService]}
                ],
                optionalServices: MiBand.optionalServices
            });

            device.addEventListener('gattserverdisconnected', () => {
                console.log('Device disconnected');
            });

            device.gatt.disconnect();

            console.log('Connecting to the device...');
            const server = device.gatt.connect();
            console.log('Connected');

            const miband = new MiBand(server);

            miband.init();

            test_all(miband, console.log);

        } catch (error) {
            console.log('Argh!', error);
        }
    }

    render() {
        if (this.state.support) {
            return (
                <div>
                    <h1>YES</h1>
                    <button onClick={this.connect}>
                        scan
                    </button>
                </div>
            )
        } else {
            return (
                <h1>您的浏览器不支持WebBluetooth请使用以下浏览器</h1>
            )
        }
    }
}


export default App;
