import { WebAudioModule } from './sdk/index.js';
import * as patch from "./cmaj_Pro54.js";
import { createPatchViewHolder } from "./cmaj_api/cmaj-patch-view.js"

const getBaseUrl = (relativeURL) => {
  const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf('/'));
  return baseURL;
};

export default class CmajModule extends WebAudioModule
{
  async createAudioNode (options)
  {
    this.patchConnection = await patch.createAudioWorkletNodePatchConnection (this.audioContext, "cmaj-processor");

    const getInputWithPurpose = (purpose) =>
    {
      for (const i of this.patchConnection.inputEndpoints)
        if (i.purpose === purpose)
          return i.endpointID;
    }

    this.patchConnection.audioNode.module = this;
    this.patchConnection.audioNode.midiEndpointID = getInputWithPurpose ("midi in");
    this.patchConnection.audioNode.patchConnection = this.patchConnection;

    // Add missing functions to extend the AudioWorklet to meet the WamNode functionality
    this.patchConnection.audioNode.destroy = function()
    {
    };

    this.patchConnection.audioNode.getParameterInfo = function()
    {
      return {};
    };

    this.patchConnection.audioNode.scheduleEvents = function (msg)
    {
      switch (msg.type)
      {
        case "wam-midi":
          if (this.midiEndpointID)
            this.patchConnection.sendMIDIInputEvent (this.midiEndpointID, msg.data.bytes[2] | (msg.data.bytes[1] << 8) | (msg.data.bytes[0] << 16));
          break;

        case "wam-automation":
          console.log ("received automation message " + JSON.stringify (msg));
          break;
      }
    }

    return this.patchConnection.audioNode;
  }

  async initialize (state)
  {
    const hasPurpose = (endpoints, purpose) =>
    {
      for (const i of endpoints)
        if (i.purpose === purpose)
          return true;

      return false;
    }

    const descriptor =
    {
      identifier:     patch.manifest.ID,
      name:           patch.manifest.name,
      description:    patch.manifest.description,
      version:        patch.manifest.version,
      vendor:         patch.manifest.manufacturer,
      isInstrument:   patch.manifest.isInstrument,
      thumbnail:      patch.manifest.icon,
      website:        patch.manifest.URL,
      hasMidiInput:   hasPurpose (patch.getInputEndpoints(), "midi in"),
      hasAudioInput:  hasPurpose (patch.getInputEndpoints(), "audio in"),
      hasMidiOutput:  hasPurpose (patch.getOutputEndpoints(), "midi out"),
      hasAudioOutput: hasPurpose (patch.getOutputEndpoints(), "audio out"),
    };

    Object.assign (this.descriptor, descriptor);
    return super.initialize(state);
    }

  createGui()
  {
    return createPatchViewHolder (this.patchConnection);
  }

  destroyGui()
  {
  }
}
