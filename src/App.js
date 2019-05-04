import React, {Component} from 'react';
import MiBand from 'miband';
import test_all from './test';
import {Table, Collapse, Button} from 'antd';
import $ from 'jquery';
import 'antd/dist/antd.css';
import './App.css';

const Panel = Collapse.Panel;

function log() {
    const msg = [...arguments].join(' ');
    console.log(msg);
    $('.connect-log').append(`<p>${msg}</p>`)
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class NotSupport extends Component {
    render() {
        return (
            <div>
                <h1>Your Browser Don't Support WebBluetooth</h1>
                <h2>You can get information at
                    https://github.com/WebBluetoothCG/web-bluetooth/blob/master/implementation-status.md</h2>
            </div>
        )
    }
}

class Info extends Component {
    render() {
        const columns = [{
            title: '名称',
            dataIndex: 'key',
            key: 'key',
        }, {
            title: '值',
            dataIndex: 'value',
            key: 'value',
        }];
        return (
            <Table dataSource={this.props.dataSource} loading={this.props.isLoading} columns={columns}
                   pagination={false}/>
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
            connecting: false,
            info: [],
            miband: false,
        };
    }

    render() {
        const _this = this;
        const bluetooth = navigator.bluetooth;

        async function connect() {
            log('Start connect');
            if (!bluetooth) {
                log('WebBluetooth is not supported by your browser!');
                return;
            }

            _this.setState({connecting: true});

            try {
                log('Requesting Bluetooth Device...');
                const device = await bluetooth.requestDevice({
                    filters: [
                        {services: [MiBand.advertisementService]}
                    ],
                    optionalServices: MiBand.optionalServices
                });

                device.addEventListener('gattserverdisconnected', () => {
                    log('Device disconnected');
                });
                await device.gatt.disconnect();
                log('Connecting to the device...');

                const server = await device.gatt.connect();
                log('Connected');

                log('Connecting to your Miband...');
                let miband = new MiBand(server);
                await miband.init();
                log('Finished. Please wait.');

                _this.setState({connected: true});

                await miband.showNotification('message');

                let info = {
                    time: await miband.getTime(),
                    battery: await miband.getBatteryInfo(),
                    hw_ver: await miband.getHwRevision(),
                    sw_ver: await miband.getSwRevision(),
                    serial: await miband.getSerial(),
                };

                let ped = await miband.getPedometerStats();

                _this.setState({
                    info: [
                        {key: '硬件版本', value: info.hw_ver},
                        {key: '软件版本', value: info.sw_ver},
                        {key: '电量', value: info.battery.level + '%'},
                        {key: '时间', value: info.time.toLocaleString()},
                        {key: '步数', value: ped.steps},
                        {key: '里程', value: ped.distance + 'm'},
                        {key: '消耗', value: ped.calories + 'cal'},
                    ]
                });

                _this.setState({miband: miband});

                delay(0);
            } catch (error) {
                log('Argh!', error);
            }

            _this.setState({connecting: false})
        }

        async function test() {
            log('ACTION: test all');
            await test_all(_this.state.miband, log)
        }

        async function notice_phone() {
            log('ACTION: phone notice');
            await _this.state.miband.showNotification('phone');
        }

        async function notice_message() {
            log('ACTION: message notice');
            await _this.state.miband.showNotification('message');
        }

        async function notice_close() {
            log('ACTION: close notice');
            await _this.state.miband.showNotification('off');
        }

        if (this.state.support) {
            if (!this.state.connected) {
                return (
                    <div className="container">
                        <h1>MibandWeb</h1>
                        <h2>点击CONNECT连接到手环</h2>
                        <div className="connect-line">
                            <div className="connect-btn" onClick={connect}>
                                {this.state.connecting ? 'WAIT' : 'CONNECT'}
                            </div>
                        </div>
                        <div className="connect-log">
                            <h3>connect log</h3>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div>
                        <h1>MibandWeb</h1>
                        <h2>{this.state.connected ? 'CONNECTED' : 'CONNECTING'}</h2>
                        <Collapse defaultActiveKey={['1']}>
                            <Panel header="INFO" key="1">
                                <Info dataSource={this.state.info} isLoading={!this.state.connected}/>
                            </Panel>
                            <Panel header="LOG" key="4">
                                <div className="connect-log" id="log">
                                    <h3>connect log</h3>
                                </div>
                            </Panel>
                            <Panel header="ACTION" key="2">
                                <Button block onClick={test}>全部测试</Button><br/>
                                <Button block onClick={notice_phone}>电话通知</Button><br/>
                                <Button block onClick={notice_message}>短信通知</Button><br/>
                                <Button block onClick={notice_close}>关闭通知</Button><br/>
                            </Panel>
                            <Panel header="TEST" key="3">
                                <p>test</p>
                            </Panel>
                        </Collapse>
                    </div>
                )
            }
        } else {
            return (
                <NotSupport/>
            )
        }
    }
}


export default App;
