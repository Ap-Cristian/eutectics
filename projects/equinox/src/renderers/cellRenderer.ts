import { CellShaderContainer } from "../containers/cell-shader.container";
import { NUMBER_OF_CELLS } from "../engine";
import { Camera } from "../objects/camera/camera";
import { CellRenderPipeline } from "../objects/cell/cell.render.pipeline";
import { Scene } from "../objects/scene/scene";
import { device } from "../renderer";
import { Renderer } from "./rendererBase";

export class CellRenderer extends Renderer{
    private cell_positionArray:         Float32Array;
    private cell_rotationArray:         Float32Array;
    private cell_scaleArray:            Float32Array;
    private cell_renderPipeline:        GPURenderPipeline;
    private cell_rotationBuffer:        GPUBuffer;
    private cell_scaleBuffer:           GPUBuffer;
    private cell_verticesBuffer:        GPUBuffer;
    private cell_positionBuffer:        GPUBuffer;
    private cell_uniformBindGroup:      GPUBindGroup;
    private cell_shaderContainer:       CellShaderContainer;

    private frameErrorProbed:boolean = false;

    constructor(){
        super();

        this.cell_renderPipeline = CellRenderPipeline.GetInstance().Pipeline;
        this.cell_shaderContainer = CellShaderContainer.getInstance();
    }

    initUniforms(scene: Scene, camera: Camera): void {
        if(!this.frameErrorProbed){
            device.pushErrorScope("validation")
            device.pushErrorScope("out-of-memory")
            device.pushErrorScope("internal")
        }

        var objects = scene.getObjects();
        this.cell_positionArray = new Float32Array(NUMBER_OF_CELLS * 3);
        this.cell_rotationArray = new Float32Array(NUMBER_OF_CELLS * 3);
        this.cell_scaleArray = new Float32Array(NUMBER_OF_CELLS * 3);

        var currentMemOffset = 0;
        for(let i = 0; i < NUMBER_OF_CELLS; i++){
            this.cell_positionArray[currentMemOffset] = objects[i].X;
            this.cell_rotationArray[currentMemOffset] = objects[i].RotationX;
            this.cell_scaleArray[currentMemOffset]    = objects[i].ScaleX;
            currentMemOffset++;

            this.cell_positionArray[currentMemOffset] = objects[i].Y;
            this.cell_rotationArray[currentMemOffset] = objects[i].RotationY;
            this.cell_scaleArray[currentMemOffset]    = objects[i].ScaleY;
            currentMemOffset++;

            this.cell_positionArray[currentMemOffset] = objects[i].Z;
            this.cell_rotationArray[currentMemOffset] = objects[i].RotationZ;
            this.cell_scaleArray[currentMemOffset]    = objects[i].ScaleZ;
            currentMemOffset++;
        }


        //Model view projection matrix
        // for(let i = 0; i < NUMBER_OF_CELLS; i++){
        //     mat4.multiply(camera.getCameraViewProjMatrix(), cellsModelsTranformationMatrixes[i], projectionAppliedResultMat);
        //     this.MVPMatrices.set(projectionAppliedResultMat, currentMatStep);
        //     currentMatStep += 4*4;
        // }
        //

        console.log("DEV_VIDEO_MAX_BUFFER_MEM_SIZE: ", device.limits.maxBufferSize)
        console.log("DEV_VIDEO_MAX_UNIFORM_MEM_SIZE: ", device.limits.maxUniformBufferBindingSize)

        // var uniformBindingsCount = 1024 > 4 * 16 * NUMBER_OF_CELLS ? 1024 : 4 * 16 * NUMBER_OF_CELLS

        this.cell_positionBuffer = device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 3 * NUMBER_OF_CELLS < 16 ? 
                    16 : Float32Array.BYTES_PER_ELEMENT * 3 * NUMBER_OF_CELLS, // MEM SIZE EXCEDED
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.cell_scaleBuffer = device.createBuffer({
            size:  Float32Array.BYTES_PER_ELEMENT * 3 * NUMBER_OF_CELLS < 16 ? 
                    16 : Float32Array.BYTES_PER_ELEMENT * 3 * NUMBER_OF_CELLS, // MEM SIZE EXCEDED
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.cell_rotationBuffer = device.createBuffer({
            size:  Float32Array.BYTES_PER_ELEMENT * 3 * NUMBER_OF_CELLS < 16 
                    ? 16 : Float32Array.BYTES_PER_ELEMENT * 3 * NUMBER_OF_CELLS, // MEM SIZE EXCEDED
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.cameraProjectionBuffer = device.createBuffer({
            size: 16 * Float32Array.BYTES_PER_ELEMENT, // MEM SIZE EXCEDED
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        var uniformBindGroupEntries:Iterable<GPUBindGroupEntry> = [
            {
                binding: 0,      
                resource: {
                  buffer: this.cell_rotationBuffer,
                }
            },
            {
                binding: 1,
                resource: {                         //position
                  buffer: this.cell_positionBuffer,
                }
            },
            {
                binding: 2,
                resource: {                         //position
                  buffer: this.cameraProjectionBuffer,
                }
            }
        ];

        this.cell_uniformBindGroup = device.createBindGroup({
            layout: this.cell_renderPipeline.getBindGroupLayout(0),
            entries: uniformBindGroupEntries
        });
        this.cell_verticesBuffer = device.createBuffer({
            size: this.cell_shaderContainer.vertexArray.length * this.stride,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });

        // console.log("VERTERX COUNT:" + this.cellShaderContainer.vertexArray.length)

        const mapping = new Float32Array(this.cell_verticesBuffer.getMappedRange());
        var vertexByteOffset = 0;
        for (let i = 0; i < this.cell_shaderContainer.vertexArray.length; i++) {
            var vert_X = this.cell_shaderContainer.vertexArray[i].pos[0];
            var vert_Y = this.cell_shaderContainer.vertexArray[i].pos[1];
            var vert_Z = this.cell_shaderContainer.vertexArray[i].pos[2];

            mapping.set([vert_X, vert_Y, vert_Z, 1], vertexByteOffset);
            vertexByteOffset += 4;
            
            this.cell_shaderContainer.vertexArray[i].norm.push(1)
            mapping.set(this.cell_shaderContainer.vertexArray[i].norm, vertexByteOffset);
            vertexByteOffset += 4;
        }
        this.cell_verticesBuffer.unmap();
        
        if(!this.frameErrorProbed){
            //temp error handling
            device.popErrorScope().then((err)=>{
                if(err)
                    console.error(err?.message);
            })
            device.popErrorScope().then((err)=>{
                if(err)
                    console.error(err?.message);
            })
            device.popErrorScope().then((err)=>{
                if(err)
                    console.error(err?.message);
            })
        }
    }
    frame(passEncoder: GPURenderPassEncoder, cameraProjectionArray:Float32Array): void {
        device.queue.writeBuffer(
            this.cell_scaleBuffer,  //write to transformation buffer which is then used into the transformation bind group trough the entries var on line 98 
            0,
            this.cell_scaleArray.buffer,
            this.cell_scaleArray.byteOffset,
            this.cell_scaleArray.byteLength 
        );

        device.queue.writeBuffer(
            this.cell_positionBuffer,  //write to transformation buffer which is then used into the transformation bind group trough the entries var on line 98 
            0,
            this.cell_positionArray.buffer,
            this.cell_positionArray.byteOffset,
            this.cell_positionArray.byteLength 
        );

        device.queue.writeBuffer(
            this.cell_rotationBuffer,  //write to transformation buffer which is then used into the transformation bind group trough the entries var on line 98 
            0,
            this.cell_rotationArray.buffer,
            this.cell_rotationArray.byteOffset,
            this.cell_rotationArray.byteLength 
        );

        device.queue.writeBuffer(
            this.cameraProjectionBuffer,  //write to transformation buffer which is then used into the transformation bind group trough the entries var on line 98 
            0,
            cameraProjectionArray.buffer,
            cameraProjectionArray.byteOffset,
            cameraProjectionArray.byteLength 
        );

        passEncoder.setVertexBuffer(0, this.cell_verticesBuffer);
        passEncoder.setPipeline(this.cell_renderPipeline);
        passEncoder.setBindGroup(0, this.cell_uniformBindGroup);
        passEncoder.draw(this.cell_shaderContainer.vertexArray.length, NUMBER_OF_CELLS, 0, 0);
    }
}