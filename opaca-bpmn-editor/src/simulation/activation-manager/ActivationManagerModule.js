import {getRootElement} from "../../provider/util";

export default function ActivationManager(elementRegistry, eventBus){

    this._modules = [];

    eventBus.on('tokenSimulation.toggleMode', () => {

        const elements = elementRegistry.getAll();
        const root = getRootElement(elements[0]);
        const isExecutable = root?.isExecutable || false;

        this.updateModules(isExecutable);
    });
}

ActivationManager.prototype.registerModule = function(module){
    // Register a module
    this._modules.push(module);
}

ActivationManager.prototype.updateModules = function(isExecutable){
    // Update activation of each registered module
    this._modules.forEach(module => {
        module.setActive(isExecutable);
    });
}

ActivationManager.$inject = [
    'elementRegistry',
    'eventBus'
];