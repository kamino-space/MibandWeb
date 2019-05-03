import React, {Component} from 'react';
import MiBand from 'miband';
import test_all from './test';
import {Table} from 'antd';
import 'antd/dist/antd.css';

class Info extends Component {
    render() {
        const columns = [{
            title: '参数',
            dataIndex: 'key',
            key: 'key',
        }, {
            title: '值',
            dataIndex: 'value',
            key: 'value',
        }];
        return (
            <Table dataSource={this.props.dataSource} columns={columns}/>
        )
    }
}

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            support: true,
            connected: false,
            info: [],
        };
    }

    render() {
        const _this = this;
        const bluetooth = navigator.bluetooth;
        let miband;

        async function connect() {
            console.log('start connect');
            if (!bluetooth) {
                console.log('WebBluetooth is not supported by your browser!');
                return;
            }

            try {
                console.log('Requesting Bluetooth Device...');
                const device = await bluetooth.requestDevice({
                    filters: [
                        {services: [MiBand.advertisementService]}
                    ],
                    optionalServices: MiBand.optionalServices
                });

                device.addEventListener('gattserverdisconnected', () => {
                    console.log('Device disconnected');
                });
                await device.gatt.disconnect();
                console.log('Connecting to the device...');

                const server = await device.gatt.connect();
                console.log('Connected');

                miband = new MiBand(server);
                await miband.init();

                _this.setState({connected: true});

                await miband.showNotification('message');

            } catch (error) {
                console.log('Argh!', error);
            }
        }

        async function test() {
            await test_all(miband, console.log)
        }

        async function get_info() {
            console.log('start get info');
            let info = [
                {key: 'time', value: await miband.getTime()},

            ];
            console.log(info);
            _this.setState({info: info});
        }

        async function notice_phone() {
            await miband.showNotification('phone');
        }

        if (this.state.support) {
            return (
                <div>
                    <h1>YES</h1>
                    <h2>{this.state.connected ? 'CONNECTED' : 'CONNECTING'}</h2>
                    <button onClick={connect}>
                        scan
                    </button>
                    <button onClick={test}>
                        test
                    </button>
                    <button disabled onClick={get_info}>
                        info
                    </button>
                    <button disabled onClick={notice_phone}>
                        phone
                    </button>
                    {this.state.connected ? <Info dataSource={this.state.info}/> : null}
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
