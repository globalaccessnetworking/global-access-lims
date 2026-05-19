import DynamicModule from './DynamicModule';

const StrainRepository = () => {
    return <DynamicModule type="BiologicalAssets" filter="Strain" />;
};

export default StrainRepository;
